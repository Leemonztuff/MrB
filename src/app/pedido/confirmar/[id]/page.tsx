import { getPublicOrderDetails } from "@/app/admin/actions/orders.actions";
import { Logo } from "@/app/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const errorMessages: Record<string, string> = {
  missing_token: "Falta el token de confirmación.",
  confirmation_failed: "Error al confirmar el pedido. Intenta nuevamente.",
  invalid_token: "Token de confirmación inválido.",
  not_found: "Pedido no encontrado.",
  invalid_status: "Este pedido aún no fue despachado.",
};

export default async function OrderConfirmationPortal({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { id } = await params;
  const { error: errorParam } = await searchParams;

  const { data: order, error } = await getPublicOrderDetails(id);

  if (errorParam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <Logo showText={true} className="mb-8" />
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4 text-destructive">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <CardTitle>Error de Confirmación</CardTitle>
            <CardDescription>
              {errorMessages[errorParam] || "Ocurrió un error inesperado."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <Logo showText={true} className="mb-8" />
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4 text-destructive">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <CardTitle>Pedido No Encontrado</CardTitle>
            <CardDescription>
              El enlace que utilizaste es inválido o el pedido ya no existe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Logo showText={true} className="mb-8" />
      <Card className="w-full max-w-md text-center shadow-xl border-white/10 glass">
        <CardHeader>
          <div className="flex justify-center mb-4 text-primary">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tight">¡Muchas Gracias!</CardTitle>
          <CardDescription className="text-base">
            Hemos registrado la recepción de tu mercadería correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="text-muted-foreground leading-relaxed">
            Agradecemos tu colaboración. Esta información nos ayuda a mejorar nuestro servicio de logística para vos.
          </p>

          {order.order_items && order.order_items.length > 0 && (
            <div className="mt-8 pt-6 border-t border-dashed text-left">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold text-center">
                Detalle de Productos
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1 mb-4">
                Revisa el pedido aquí:
              </p>
              <ul className="space-y-2">
                {order.order_items.map((item, idx) => {
                  const product = Array.isArray(item.products) ? item.products[0] : item.products;
                  const productName = product?.name ?? 'Producto';
                  return (
                    <li key={idx} className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
                      <span className="shrink-0 min-w-7 h-6 px-1.5 bg-primary/10 text-primary rounded-md text-xs font-black flex items-center justify-center tabular-nums">
                        {item.quantity}
                      </span>
                      <span className="text-sm text-foreground/90 truncate">
                        {productName}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

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
