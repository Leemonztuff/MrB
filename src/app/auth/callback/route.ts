import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LINK_TYPES: EmailOtpType[] = ["invite", "magiclink", "recovery"];

function isLinkType(value: string | null): value is EmailOtpType {
  return Boolean(value && LINK_TYPES.includes(value as EmailOtpType));
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const authError = searchParams.get("error");

  if (authError) {
    console.error("No se pudo completar el acceso:", searchParams.get("error_description") ?? authError);
    return NextResponse.redirect(new URL("/login?error=invite_expired", request.url));
  }

  let verificationError: Error | null = null;
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    verificationError = result.error;
  } else if (tokenHash && isLinkType(type)) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    verificationError = result.error;
  } else {
    verificationError = new Error("El enlace no contiene un código de acceso válido.");
  }

  if (verificationError) {
    console.error("No se pudo verificar el enlace de acceso:", verificationError.message);
    return NextResponse.redirect(new URL("/login?error=invite_expired", request.url));
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("El enlace se verificó sin crear una sesión:", userError?.message ?? "Usuario no disponible.");
    return NextResponse.redirect(new URL("/login?error=invite_session", request.url));
  }

  if (user.app_metadata?.role !== "operario") {
    if (user.app_metadata?.role || !user.invited_at || !supabaseAdmin) {
      console.error("La cuenta no tiene un rol de operario válido.");
      return NextResponse.redirect(new URL("/login?error=invite_role", request.url));
    }

    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: "operario" },
    });
    if (roleError) {
      console.error("No se pudo completar el rol de la cuenta:", roleError.message);
      return NextResponse.redirect(new URL("/login?error=invite_role", request.url));
    }

    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error("No se pudo actualizar la sesión:", refreshError.message);
      return NextResponse.redirect(new URL("/login?error=invite_session", request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/complete-account", request.url));
}
