import { getPublicOrderDetails } from "@/app/admin/actions/orders.actions";
import { Logo } from "@/app/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PackageCheck, AlertTriangle, Truck, Receipt } from "lucide-react";
import { ConfirmationButton } from "./_components/confirmation-button";
import { redirect } from "next/navigation";

export default async function OrderConfirmationPortal({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ success?: string }>
}) {
  const { id } = await params;
  const sParams = await searchParams;
  const success = sParams.success === 'true';

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
  // which redirects here once finished or if already processed.
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <Logo showText={true} className="mb-8" />
        <Card className="w-full max-w-md text-center border-primary/20 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="h-2 bg-primary w-full" />
          <CardHeader>
            <div className="flex justify-center mb-6 text-primary drop-shadow-sm">
              <div className="bg-primary/10 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">¡Entrega Confirmada!</CardTitle>
            <CardDescription className="text-base font-medium">
              Hemos registrado la recepción de tu mercadería correctamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <p className="text-muted-foreground leading-relaxed text-sm italic">
              Agradecemos tu colaboración. Esta información nos ayuda a mejorar nuestro servicio de logística para vos.
            </p>
            <div className="mt-8 pt-6 border-t border-dashed flex flex-col items-center gap-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Resumen del Pedido</p>
              <p className="text-base font-black italic uppercase tracking-tight">{order.client_name_cache}</p>
              <p className="text-[10px] text-muted-foreground font-bold font-mono">ID: #{id.slice(-6).toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>
        <p className="mt-8 text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">MR. BLONDE LOGISTICS v2.0</p>
      </div>
    );
  }

  const isAlreadyDelivered = order.status === 'entregado';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <Logo showText={true} className="mb-8" />
      <Card className="w-full max-w-md border-white/10 shadow-2xl overflow-hidden glass">
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Recepción de Pedido</span>
          </div>
          <span className="text-[10px] font-black font-mono opacity-60">#{id.slice(-6).toUpperCase()}</span>
        </div>

        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">{order.client_name_cache}</CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
            Por favor, revisa el detalle y confirma los productos recibidos.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              <Receipt className="h-3 w-3" />
              <span>Productos en este envío</span>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
              {order.order_items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-white border border-black/5 rounded-2xl shadow-sm"
                >
                  {/* Quantity Badge - High Visibility */}
                  <div className="flex-shrink-0 w-12 h-12 bg-black rounded-xl flex flex-col items-center justify-center text-white">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 leading-none mb-0.5">CANT.</span>
                    <span className="text-xl font-black italic leading-none">{item.quantity}</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-black leading-tight uppercase tracking-tight truncate">
                      {item.products?.name}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5 opacity-60">
                      {item.products?.category || "GENERAL"}
                    </p>
                  </div>

                  {/* Visual Aid for manual check */}
                  <div className="flex-shrink-0 w-6 h-6 border-2 border-black/10 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-black/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            {isAlreadyDelivered ? (
              <div className="flex flex-col items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <p className="text-xs font-black uppercase tracking-widest text-green-500">Este pedido ya fue confirmado</p>
              </div>
            ) : (
              <ConfirmationButton orderId={id} />
            )}
          </div>
        </CardContent>
      </Card>
      <p className="mt-8 text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">MR. BLONDE LOGISTICS v2.0</p>
    </div>
  );
}
