"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseClientWithAuth, handleAction } from "./_helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

const emailSchema = z.string().trim().email("Ingresá un correo electrónico válido.").max(254);

export type OperatorAccount = {
  id: string;
  email: string;
  confirmedAt: string | null;
  bannedUntil: string | null;
  lastSignInAt: string | null;
};

function requireSupabaseAdmin() {
  if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
  return supabaseAdmin;
}

export async function getOperatorAccounts() {
  return handleAction(async () => {
    await getSupabaseClientWithAuth();
    const admin = requireSupabaseAdmin();
    const accounts: OperatorAccount[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const operatorUsers = data.users
        .filter(user => user.app_metadata?.role === "operario")
        .map(user => ({
          id: user.id,
          email: user.email ?? "",
          confirmedAt: user.email_confirmed_at ?? null,
          bannedUntil: (user as typeof user & { banned_until?: string | null }).banned_until ?? null,
          lastSignInAt: user.last_sign_in_at ?? null,
        }));
      accounts.push(...operatorUsers);
      if (data.users.length < perPage) break;
      page += 1;
    }

    return accounts.sort((a, b) => a.email.localeCompare(b.email));
  });
}

export async function inviteOperator(email: string) {
  return handleAction(async () => {
    await getSupabaseClientWithAuth();
    const validatedEmail = emailSchema.parse(email).toLowerCase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("Configurá NEXT_PUBLIC_APP_URL antes de enviar invitaciones.");
    }

    const admin = requireSupabaseAdmin();
    const redirectTo = new URL("/auth/callback", appUrl).toString();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(validatedEmail, { redirectTo });
    if (error) throw error;
    if (!data.user) throw new Error("Supabase no devolvió el usuario invitado.");

    const { error: roleError } = await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { ...data.user.app_metadata, role: "operario" },
    });
    if (roleError) {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
      if (cleanupError) {
        console.error("No se pudo limpiar una invitación a operario sin rol:", cleanupError.message);
      }
      throw roleError;
    }

    revalidatePath("/admin/settings");
    return { email: validatedEmail };
  });
}

export async function setOperatorAccess(userId: string, enabled: boolean) {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { data: { user: currentUser }, error: currentUserError } = await supabase.auth.getUser();
    if (currentUserError) throw currentUserError;
    if (!currentUser) throw new Error("Iniciá sesión nuevamente.");
    if (currentUser.id === userId) throw new Error("No podés cambiar el acceso de tu propia cuenta.");

    const admin = requireSupabaseAdmin();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError) throw targetError;
    if (target.user.app_metadata?.role !== "operario") {
      throw new Error("Solo se puede modificar el acceso de cuentas de operario.");
    }

    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: enabled ? "none" : "876000h",
    });
    if (error) throw error;

    revalidatePath("/admin/settings");
    return null;
  });
}

export async function resetOperatorPin(userId: string) {
  return handleAction(async () => {
    await getSupabaseClientWithAuth();
    const admin = requireSupabaseAdmin();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError) throw targetError;
    if (target.user.app_metadata?.role !== "operario") {
      throw new Error("Solo se puede restablecer el PIN de una cuenta de operario.");
    }

    const { error } = await admin
      .from("operator_access_pins")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;

    revalidatePath("/admin/settings");
    return null;
  });
}
