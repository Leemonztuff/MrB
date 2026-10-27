"use server";

import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleAction } from "./_helpers";
import {
  clearOperatorUnlockCookie,
  getOperatorPinRecord,
  requireOperatorPinSession,
  setOperatorUnlockCookie,
} from "@/lib/operator-pin-server";

const derivePinHash = promisify(pbkdf2);
const pinSchema = z.string().regex(/^\d{5}$/, "El PIN debe tener exactamente 5 dígitos.");

async function getOperatorUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user || user.app_metadata?.role !== "operario") {
    throw new Error("Esta opción está disponible únicamente para cuentas de operario.");
  }
  return user;
}

async function hashPin(pin: string, salt: string) {
  const derived = await derivePinHash(pin, Buffer.from(salt, "hex"), 310_000, 32, "sha256");
  return Buffer.from(derived).toString("hex");
}

function getAdminClient() {
  if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
  return supabaseAdmin;
}

export async function getOperatorPinStatus() {
  return handleAction(async () => {
    const user = await getOperatorUser();
    const pin = await getOperatorPinRecord(user.id);
    return { configured: Boolean(pin) };
  });
}

export async function verifyOperatorPin(pinValue: string) {
  return handleAction(async () => {
    const user = await getOperatorUser();
    const pin = pinSchema.parse(pinValue);
    const record = await getOperatorPinRecord(user.id);
    if (!record) throw new Error("Todavía no configuraste tu PIN. Creá uno para continuar.");

    const hash = Buffer.from(await hashPin(pin, record.pin_salt), "hex");
    const expected = Buffer.from(record.pin_hash, "hex");
    const matches = hash.length === expected.length && timingSafeEqual(hash, expected);
    const { data: attemptResult, error } = await getAdminClient().rpc("record_operator_pin_attempt", {
      p_user_id: user.id,
      p_is_valid: matches,
    });
    if (error) throw error;
    if (attemptResult !== "accepted") {
      throw new Error(attemptResult === "locked"
        ? "Se alcanzó el límite de intentos. Esperá 15 minutos antes de volver a probar."
        : "El PIN ingresado no es correcto.");
    }

    await setOperatorUnlockCookie(user.id, record.updated_at);
    return null;
  });
}

export async function saveOperatorPin(pinValue: string, confirmationValue: string) {
  return handleAction(async () => {
    const user = await getOperatorUser();
    const pin = pinSchema.parse(pinValue);
    const confirmation = pinSchema.parse(confirmationValue);
    if (pin !== confirmation) throw new Error("Los PIN no coinciden.");

    const currentPin = await getOperatorPinRecord(user.id);
    if (currentPin) await requireOperatorPinSession(user.id);

    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(pin, salt);
    const updatedAt = new Date().toISOString();
    const { error } = await getAdminClient()
      .from("operator_access_pins")
      .upsert({
        user_id: user.id,
        pin_hash: pinHash,
        pin_salt: salt,
        failed_attempts: 0,
        locked_until: null,
        updated_at: updatedAt,
      }, { onConflict: "user_id" });
    if (error) throw error;

    await setOperatorUnlockCookie(user.id, updatedAt);
    revalidatePath("/admin/operator-settings");
    return null;
  });
}

export async function lockOperatorSession() {
  await getOperatorUser();
  await clearOperatorUnlockCookie();
  revalidatePath("/admin");
  redirect("/operator/unlock");
}
