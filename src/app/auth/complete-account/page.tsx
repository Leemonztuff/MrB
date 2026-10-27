import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/app/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountPasswordForm } from "./_components/account-password-form";

export default async function CompleteOperatorAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=invite_session");
  if (user.app_metadata?.role !== "operario") redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <Logo showText />
          </div>
          <CardTitle>Prepará tu acceso</CardTitle>
          <CardDescription>
            Elegí una contraseña para ingresar al tablero de pedidos desde tu celular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
