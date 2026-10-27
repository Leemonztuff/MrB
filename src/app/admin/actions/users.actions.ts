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
  pendingActivation: boolean;
};

export type OperatorActivationLink = {
  email: string;
  activationUrl: string;
};

function requireSupabaseAdmin() {
  if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
  return supabaseAdmin;
}

async function findUserByEmail(admin: ReturnType<typeof requireSupabaseAdmin>, email: string) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(user => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
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
          pendingActivation: Boolean(user.app_metadata?.pending_activation),
        }));
      accounts.push(...operatorUsers);
      if (data.users.length < perPage) break;
      page += 1;
    }

    return accounts.sort((a, b) => a.email.localeCompare(b.email));
  });
}

export async function createOperatorActivationLink(email: string) {
  return handleAction(async () => {
    await getSupabaseClientWithAuth();
    const validatedEmail = emailSchema.parse(email).toLowerCase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("Configurá NEXT_PUBLIC_APP_URL antes de generar enlaces de activación.");
    }

    const admin = requireSupabaseAdmin();
    const existingUser = await findUserByEmail(admin, validatedEmail);

    if (!existingUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email: validatedEmail,
        email_confirm: true,
        app_metadata: { role: "operario", pending_activation: true },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Supabase no devolvió el usuario creado.");
    } else {
      if (existingUser.app_metadata?.role !== "operario") {
        throw new Error("Ese correo ya pertenece a otra cuenta.");
      }
      const bannedUntil = (existingUser as typeof existingUser & { banned_until?: string | null }).banned_until;
      if (bannedUntil && new Date(bannedUntil).getTime() > Date.now()) {
        throw new Error("Habilitá el acceso de este operario antes de generar un enlace.");
      }
      const { error } = await admin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        app_metadata: { ...existingUser.app_metadata, role: "operario", pending_activation: true },
      });
      if (error) throw error;
    }

    const redirectTo = new URL("/auth/activate", appUrl).toString();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: validatedEmail,
      options: { redirectTo },
    });
    if (linkError) throw linkError;

    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) throw new Error("Supabase no generó el enlace de activación.");

    const activationUrl = new URL("/auth/activate", appUrl);
    activationUrl.searchParams.set("token_hash", tokenHash);
    activationUrl.searchParams.set("type", "recovery");

    revalidatePath("/admin/settings");
    return { email: validatedEmail, activationUrl: activationUrl.toString() };
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

export async function deleteOperatorAccount(userId: string) {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { data: { user: currentUser }, error: currentUserError } = await supabase.auth.getUser();
    if (currentUserError) throw currentUserError;
    if (!currentUser) throw new Error("Iniciá sesión nuevamente.");
    if (currentUser.id === userId) throw new Error("No podés eliminar tu propia cuenta.");

    const admin = requireSupabaseAdmin();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError) throw targetError;
    if (target.user.app_metadata?.role !== "operario") {
      throw new Error("Solo se pueden eliminar cuentas de operario.");
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
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
