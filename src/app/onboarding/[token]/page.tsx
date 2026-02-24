import { getOnboardingClient } from "@/app/actions/user.actions";
import { OnboardingForm } from "./_components/onboarding-form";
import { Logo } from "@/app/logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPublicLogoUrl } from "@/app/admin/actions/settings.actions";

export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: client, error } = await getOnboardingClient(token);
  const logo_url = await getPublicLogoUrl();

  if (error || !client) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-8">
            <Logo showText={true} logoUrl={null} />
        </div>
        <Card className="max-w-md mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertTriangle />
              Enlace Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">El enlace de invitación no es válido o ha expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (client.status !== 'pending_onboarding') {
    return (
       <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <Logo showText={true} logoUrl={logo_url}/>
        <Card className="max-w-md mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle />
              ¡Ya registrado!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Tus datos ya fueron completados con éxito.</p>
            {client.agreement_id && (
              <Button asChild className="w-full">
                <Link href={`/pedido/${client.agreement_id}`}>Ir al Catálogo</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4 flex flex-col items-center">
      <Logo showText={true} logoUrl={logo_url} className="mb-8" />
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Alta de Cliente</CardTitle>
            <CardDescription>Completa tus datos para empezar a realizar pedidos en Mr. Blonde.</CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm client={client} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}