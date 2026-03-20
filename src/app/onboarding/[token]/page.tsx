import Link from "next/link";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { getOnboardingClient } from "@/app/actions/user.actions";
import { getPublicLogoUrl } from "@/app/admin/actions/settings.actions";
import { Logo } from "@/app/logo";
import { OnboardingForm } from "./_components/onboarding-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = {
  success?: string;
  agreement?: string;
  status?: "active" | "pending_agreement";
};

function SuccessCard({
  logoUrl,
  status,
  agreementId,
}: {
  logoUrl: string | null;
  status: "active" | "pending_agreement";
  agreementId: string | null;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
      <Logo showText={true} logoUrl={logoUrl} />
      <Card className="mt-8 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle />
            Registro completado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "active" ? (
            <>
              <p className="mb-4 text-muted-foreground">
                Tu cuenta quedo activa y ya podes empezar a comprar.
              </p>
              <div className="space-y-2">
                {agreementId ? (
                  <Button asChild className="w-full">
                    <Link href={`/pedido/${agreementId}`}>Ir al catalogo</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/portal/login">Ir al portal</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-muted-foreground">
                Tus datos fueron guardados correctamente. Un administrador revisara tu alta y te asignara un convenio.
              </p>
              <p className="mb-6 text-sm text-muted-foreground">
                Cuando tu cuenta quede lista, podras ingresar desde el portal.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/portal/login">Ir al portal</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { token } = await params;
  const { success, agreement, status } = await searchParams;
  const logoUrl = await getPublicLogoUrl();

  if (success === "true" && (status === "active" || status === "pending_agreement")) {
    return <SuccessCard logoUrl={logoUrl} status={status} agreementId={agreement ?? null} />;
  }

  const { data: client, error } = await getOnboardingClient(token);

  if (error || !client) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-8">
          <Logo showText={true} logoUrl={null} />
        </div>
        <Card className="mt-8 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertTriangle />
              Enlace invalido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">El enlace de invitacion no es valido o expiro.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (client.status === "pending_agreement") {
    return <SuccessCard logoUrl={logoUrl} status="pending_agreement" agreementId={client.agreement_id} />;
  }

  if (client.status === "active") {
    return <SuccessCard logoUrl={logoUrl} status="active" agreementId={client.agreement_id} />;
  }

  if (client.status !== "pending_onboarding") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <Logo showText={true} logoUrl={logoUrl} />
        <Card className="mt-8 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle />
              Ya registrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">Tus datos ya fueron completados.</p>
            {client.agreement_id ? (
              <Button asChild className="w-full">
                <Link href={`/pedido/${client.agreement_id}`}>Ir al catalogo</Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contacta al administrador para mas informacion.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-8">
      <Logo showText={true} logoUrl={logoUrl} className="mb-8" />
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Alta de cliente</CardTitle>
            <p className="text-sm text-muted-foreground">
              Completa tus datos para empezar a realizar pedidos en Mr. Blonde.
            </p>
          </CardHeader>
          <CardContent>
            <OnboardingForm client={client} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
