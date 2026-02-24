
import { getPublicOrderDetails, publicConfirmOrder } from "@/app/admin/actions/orders.actions";
import { Logo } from "@/app/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PackageCheck, AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function OrderConfirmationPortal({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ success?: string }>
}) {
  const { id } = await params;

  const { data: order, error } = await getPublicOrderDetails(id);

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <Logo showText={true} className="mb-8" />
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4 text-destructive">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <CardTitle>Pedido no encontrado</CardTitle>
            <CardDescription>El enlace podría ser inválido o el pedido ya no existe.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // The confirmation is now handled by /api/pedido/confirmar/[id] 
  // which redirects here once finished or if already processed.

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <Logo showText={true} className="mb-8" />
      <Card className="w-full max-w-md text-center border-primary/20 shadow-xl overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader>
          <div className="flex justify-center mb-6 text-primary drop-shadow-sm">
            <div className="bg-primary/10 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline tracking-tight">¡Pedido Conformado!</CardTitle>
          <CardDescription className="text-base">
            Hemos registrado la recepción de tu mercadería correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="text-muted-foreground leading-relaxed">
            Agradecemos tu colaboración. Esta información nos ayuda a mejorar nuestro servicio de logística para vos.
          </p>
          <div className="mt-8 pt-6 border-t border-dashed flex flex-col items-center gap-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Resumen del Pedido</p>
            <p className="text-sm font-semibold">{order.client_name_cache}</p>
            <p className="text-xs text-muted-foreground">ID: #{id.slice(-6).toUpperCase()}</p>
          </div>
        </CardContent>
      </Card>
      <p className="mt-8 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">MR. BLONDE SYSTEM v1.0</p>
    </div>
  );
}
