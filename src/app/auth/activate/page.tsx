import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Logo } from "@/app/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activateOperatorAccount } from "./actions";

export const metadata = {
  robots: { index: false, follow: false },
};

const LINK_TYPES: EmailOtpType[] = ["invite", "magiclink", "recovery"];

function isLinkType(value: string | undefined): value is EmailOtpType {
  return Boolean(value && LINK_TYPES.includes(value as EmailOtpType));
}

export default async function ActivateOperatorPage({
  searchParams,
}: {
  searchParams?: Promise<{ token_hash?: string; type?: string }>;
}) {
  const params = await searchParams;
  const tokenHash = params?.token_hash;
  const type = params?.type;

  if (!tokenHash || !isLinkType(type)) {
    redirect("/login?error=invite_expired");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <Logo showText />
          </div>
          <CardTitle>Activar acceso</CardTitle>
          <CardDescription>
            Este enlace es personal y de un solo uso. Al continuar vas a poder definir tu contraseña para entrar al panel de pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={activateOperatorAccount}>
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
            <Button type="submit" className="min-h-11 w-full">
              Activar mi cuenta
            </Button>
          </form>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Si ya tenías una sesión abierta en este navegador, cerrá sesión antes de continuar o abrí este enlace en una ventana privada.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
