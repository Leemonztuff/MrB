import Link from "next/link";
import { MessageCircle, LifeBuoy } from "lucide-react";
import { Logo } from "@/app/logo";
import { BackButton } from "./_components/back-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicLogoUrl, getPublicWhatsappNumber } from "@/app/admin/actions/settings.actions";

export const dynamic = "force-dynamic";

export default async function AyudaPage() {
  const [{ data: logoUrl }, { data: whatsappNumber }] = await Promise.all([
    getPublicLogoUrl(),
    getPublicWhatsappNumber(),
  ]);

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        "Hola, necesito ayuda con mi pedido."
      )}`
    : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4 sm:p-8">
      <Logo showText logoUrl={logoUrl} className="mb-8" />
      <Card className="w-full max-w-lg border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 text-2xl">¿Problemas con tu pedido?</CardTitle>
          <CardDescription>
            No necesitás iniciar sesión. Estamos acá para ayudarte a volver a tu catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Qué podés hacer:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Abrí nuevamente el enlace personal que te envió Mr. Blonde. Es el que contiene <span className="font-mono text-xs">/pedido/</span> seguido de tu código.</li>
              <li>Verificá que el enlace esté completo y que no tenga espacios al final.</li>
              <li>Si el problema continúa, escribinos y contanos qué pasó.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {whatsappUrl && (
              <Button asChild variant="brand" className="min-h-11 flex-1">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Escribir por WhatsApp
                </a>
              </Button>
            )}
            <BackButton />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Si ya tenés tu enlace, volvé a abrirlo. Si no lo encontrás, pedile uno nuevo a tu vendedor.
          </p>
        </CardContent>
      </Card>
      <Link
        href="/login"
        className="mt-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      >
        Acceso administración
      </Link>
    </main>
  );
}
