"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const LINK_TYPES: EmailOtpType[] = ["invite", "magiclink", "recovery"];

function parseLinkType(value: FormDataEntryValue | null): EmailOtpType | null {
  return typeof value === "string" && LINK_TYPES.includes(value as EmailOtpType)
    ? (value as EmailOtpType)
    : null;
}

export async function activateOperatorAccount(formData: FormData) {
  const tokenHash = formData.get("token_hash");
  const type = parseLinkType(formData.get("type"));

  if (typeof tokenHash !== "string" || !tokenHash || !type) {
    redirect("/login?error=invite_expired");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    console.error("No se pudo verificar el enlace de acceso:", error.message);
    redirect("/login?error=invite_expired");
  }

  redirect("/auth/complete-account");
}
