import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createOperatorUnlockToken,
  OPERATOR_UNLOCK_COOKIE,
  OPERATOR_UNLOCK_MAX_AGE_SECONDS,
  verifyOperatorUnlockToken,
} from "@/lib/operator-pin-token";

type OperatorPinRecord = {
  pin_hash: string;
  pin_salt: string;
  updated_at: string;
};

function getPinSigningSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Configuración del servidor incompleta.");
  return secret;
}

function getAdminClient() {
  if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
  return supabaseAdmin;
}

export async function getOperatorPinRecord(userId: string) {
  const { data, error } = await getAdminClient()
    .from("operator_access_pins")
    .select("pin_hash, pin_salt, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as OperatorPinRecord | null;
}

export async function setOperatorUnlockCookie(userId: string, pinUpdatedAt: string) {
  const expiresAt = Date.now() + OPERATOR_UNLOCK_MAX_AGE_SECONDS * 1000;
  const token = createOperatorUnlockToken(
    userId,
    pinUpdatedAt,
    expiresAt,
    getPinSigningSecret()
  );
  const cookieStore = await cookies();

  cookieStore.set(OPERATOR_UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: OPERATOR_UNLOCK_MAX_AGE_SECONDS,
  });
}

export async function clearOperatorUnlockCookie() {
  const cookieStore = await cookies();
  cookieStore.set(OPERATOR_UNLOCK_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function isOperatorPinSessionUnlocked(userId: string) {
  const cookieStore = await cookies();
  const tokenValue = cookieStore.get(OPERATOR_UNLOCK_COOKIE)?.value;
  if (!tokenValue) return false;
  const token = verifyOperatorUnlockToken(
    tokenValue,
    userId,
    getPinSigningSecret()
  );
  if (!token) return false;

  const pin = await getOperatorPinRecord(userId);
  return Boolean(
    pin
    && Number.isFinite(Date.parse(pin.updated_at))
    && Date.parse(pin.updated_at) === Date.parse(token.pinUpdatedAt)
  );
}

export async function isCurrentOperatorPinSessionUnlocked() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user || user.app_metadata?.role !== "operario") return false;
  return isOperatorPinSessionUnlocked(user.id);
}

export async function requireOperatorPinSession(userId: string) {
  if (!(await isOperatorPinSessionUnlocked(userId))) {
    const error = new Error("Desbloqueá el acceso con tu PIN para continuar.") as Error & { code?: string };
    error.code = "OPERATOR_PIN_REQUIRED";
    throw error;
  }
}
