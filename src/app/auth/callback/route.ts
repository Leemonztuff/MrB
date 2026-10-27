import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const authError = searchParams.get("error");

  if (authError) {
    console.error("No se pudo completar la invitación:", searchParams.get("error_description") ?? authError);
    return NextResponse.redirect(new URL("/login?error=invite_expired", request.url));
  }

  let verificationError: Error | null = null;
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    verificationError = result.error;
  }

  if (verificationError && tokenHash && type === "invite") {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "invite",
    });
    verificationError = result.error;
  } else if (!code && tokenHash && type === "invite") {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "invite",
    });
    verificationError = result.error;
  } else if (!code && !(tokenHash && type === "invite")) {
    verificationError = new Error("El enlace no contiene un código de invitación válido.");
  }

  if (verificationError) {
    console.error("No se pudo verificar el enlace de invitación:", verificationError.message);
    return NextResponse.redirect(new URL("/login?error=invite_expired", request.url));
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("La invitación se verificó sin crear una sesión:", userError?.message ?? "Usuario no disponible.");
    return NextResponse.redirect(new URL("/login?error=invite_session", request.url));
  }

  if (user.app_metadata?.role !== "operario") {
    if (user.app_metadata?.role || !user.invited_at || !supabaseAdmin) {
      console.error("La cuenta invitada no tiene un rol de operario válido.");
      return NextResponse.redirect(new URL("/login?error=invite_role", request.url));
    }

    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: "operario" },
    });
    if (roleError) {
      console.error("No se pudo completar el rol de la cuenta invitada:", roleError.message);
      return NextResponse.redirect(new URL("/login?error=invite_role", request.url));
    }

    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error("No se pudo actualizar la sesión de la invitación:", refreshError.message);
      return NextResponse.redirect(new URL("/login?error=invite_session", request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/complete-account", request.url));
}
