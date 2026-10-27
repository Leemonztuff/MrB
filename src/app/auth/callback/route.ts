import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && type === "invite") {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "invite",
    });
    error = result.error;
  } else {
    error = new Error("El enlace de invitación no es válido.");
  }

  if (error) {
    console.error("No se pudo completar la invitación:", error.message);
    return NextResponse.redirect(new URL("/login?error=invite", request.url));
  }

  return NextResponse.redirect(new URL("/auth/complete-account", request.url));
}
