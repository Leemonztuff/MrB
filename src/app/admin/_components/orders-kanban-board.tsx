"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Clock3,
  MessageCircle,
  PackageCheck,
  Printer,
  RefreshCw,
  Truck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { DashboardBoardOrder } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { aggregateOrderItems } from "@/lib/curated-order";
import { getOrderDispatchBlocker } from "@/lib/order-workflow";
import { markOrderWorkflowStep, updateOrderStatus } from "@/app/admin/actions/orders.actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShippingLabelButton } from "./shipping-label-button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type BoardWorkload = {
  pendingOrdersCount: number;
  pendingWhatsAppCount: number;
  pendingPreparationCount: number;
  unprintedOrdersCount: number;
  dispatchedOrdersCount: number;
  deliveredOrdersCount: number;
};

type BoardOrders = {
  whatsapp: DashboardBoardOrder[];
  preparation: DashboardBoardOrder[];
  labels: DashboardBoardOrder[];
  ready: DashboardBoardOrder[];
  dispatched: DashboardBoardOrder[];
  delivered: DashboardBoardOrder[];
};

type StageId = keyof BoardOrders;

const stages: {
  id: StageId;
  title: string;
  description: string;
  icon: typeof MessageCircle;
  tone: string;
  href: string;
}[] = [
  {
    id: "whatsapp",
    title: "Por confirmar",
    description: "Recepción del pedido",
    icon: MessageCircle,
    tone: "sky",
    href: "/admin/orders?status=armado&workflow=whatsapp",
  },
  {
    id: "preparation",
    title: "Para preparar",
    description: "Armar productos y cantidades",
    icon: PackageCheck,
    tone: "violet",
    href: "/admin/orders?status=armado&workflow=preparation",
  },
  {
    id: "labels",
    title: "Para etiquetar",
    description: "Imprimir rótulo de envío",
    icon: Printer,
    tone: "amber",
    href: "/admin/orders?status=armado&labels=pending",
  },
  {
    id: "ready",
    title: "Listos para despachar",
    description: "Pasos completos",
    icon: Truck,
    tone: "emerald",
    href: "/admin/orders?status=armado",
  },
  {
    id: "dispatched",
    title: "En tránsito",
    description: "Pendientes de confirmación de entrega",
    icon: CircleCheck,
    tone: "teal",
    href: "/admin/orders?status=transito",
  },
  {
    id: "delivered",
    title: "Entregados",
    description: "Cierre y confirmación del cliente",
    icon: CircleCheck,
    tone: "emerald",
    href: "/admin/orders?status=entregado",
  },
];

const stageStyles: Record<string, { heading: string; icon: string; count: string; card: string }> = {
  sky: {
    heading: "border-sky-500/25 bg-sky-500/[0.06]",
    icon: "text-sky-700 dark:text-sky-300",
    count: "bg-sky-500/10 text-sky-800 dark:text-sky-200",
    card: "border-l-sky-500",
  },
  violet: {
    heading: "border-violet-500/25 bg-violet-500/[0.06]",
    icon: "text-violet-700 dark:text-violet-300",
    count: "bg-violet-500/10 text-violet-800 dark:text-violet-200",
    card: "border-l-violet-500",
  },
  amber: {
    heading: "border-amber-500/25 bg-amber-500/[0.06]",
    icon: "text-amber-700 dark:text-amber-300",
    count: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
    card: "border-l-amber-500",
  },
  emerald: {
    heading: "border-emerald-500/25 bg-emerald-500/[0.06]",
    icon: "text-emerald-700 dark:text-emerald-300",
    count: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    card: "border-l-emerald-500",
  },
  teal: {
    heading: "border-teal-500/25 bg-teal-500/[0.06]",
    icon: "text-teal-700 dark:text-teal-300",
    count: "bg-teal-500/10 text-teal-800 dark:text-teal-200",
    card: "border-l-teal-500",
  },
};

function OrderCard({
  order,
  stage,
  isPending,
  bundles,
  onBundlesChange,
  onWorkflowStep,
  onDispatch,
  onDelivery,
  showAmounts,
}: {
  order: DashboardBoardOrder;
  stage: StageId;
  isPending: boolean;
  bundles: number;
  onBundlesChange: (orderId: string, value: number) => void;
  onWorkflowStep: (orderId: string, step: "whatsapp" | "preparation") => void;
  onDispatch: (order: DashboardBoardOrder) => void;
  onDelivery: (order: DashboardBoardOrder) => void;
  showAmounts: boolean;
}) {
  const [deliveryConfirmationOpen, setDeliveryConfirmationOpen] = useState(false);
  const ageInHours = (Date.now() - new Date(order.created_at).getTime()) / (60 * 60 * 1000);
  const overdue = ageInHours > 48 && stage !== "dispatched";
  const productLines = aggregateOrderItems(order.order_items ?? []);
  const units = productLines.reduce((total, item) => total + item.quantity, 0);
  const stageStyle = stageStyles[stages.find(item => item.id === stage)?.tone ?? "sky"];

  return (
    <article
      className={cn(
        "rounded-xl border border-l-4 bg-card p-3.5 shadow-sm transition-colors hover:bg-muted/30",
        stageStyle.card,
        overdue && "border-t-red-500/30 border-r-red-500/30 border-b-red-500/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{order.client_name_cache}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Pedido <span className="font-mono">#{order.id.slice(-6).toUpperCase()}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-bold tabular-nums">
          {units} u.
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
        <span className={cn("inline-flex items-center gap-1 text-muted-foreground", overdue && "font-semibold text-red-700 dark:text-red-300")}>
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDistanceToNow(new Date(order.created_at), { locale: es, addSuffix: true })}
        </span>
        {showAmounts && order.total_amount !== undefined && (
          <span className="font-semibold tabular-nums text-foreground/80">
            {formatCurrency(order.total_amount)}
          </span>
        )}
      </div>

      {overdue && (
        <Badge variant="outline" className="mt-2 border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300">
          Demorado más de 48 h
        </Badge>
      )}

      {order.notes && (
        <p className="mt-2 line-clamp-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
          Nota: {order.notes}
        </p>
      )}

      {stage === "whatsapp" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 h-11 w-full gap-2"
          disabled={isPending}
          onClick={() => onWorkflowStep(order.id, "whatsapp")}
        >
          <Check className="h-4 w-4" />
          Confirmar recepción
        </Button>
      )}
      {stage === "preparation" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 h-11 w-full gap-2"
          disabled={isPending}
          onClick={() => onWorkflowStep(order.id, "preparation")}
        >
          <PackageCheck className="h-4 w-4" />
          Marcar preparado
        </Button>
      )}
      {stage === "labels" && (
        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor={`bundles-${order.id}`}>Cantidad de bultos</label>
          <Input
            id={`bundles-${order.id}`}
            type="number"
            min={1}
            max={20}
            value={bundles}
            onChange={(event) => onBundlesChange(order.id, Number.parseInt(event.target.value, 10) || 1)}
            className="h-11 w-16 text-center tabular-nums"
            aria-label={`Cantidad de bultos para ${order.client_name_cache}`}
          />
          <ShippingLabelButton orders={[{ id: order.id, bundles }]} compact />
        </div>
      )}
      {stage === "ready" && (
        <Button
          type="button"
          size="sm"
          className="mt-3 h-11 w-full gap-2"
          disabled={isPending || getOrderDispatchBlocker(order) !== null}
          onClick={() => onDispatch(order)}
        >
          <Truck className="h-4 w-4" />
          Despachar pedido
        </Button>
      )}
      {stage === "dispatched" && (
        <>
          <Button
            type="button"
            size="sm"
            className="mt-3 h-11 w-full gap-2"
            disabled={isPending}
            onClick={() => setDeliveryConfirmationOpen(true)}
          >
            <Check className="h-4 w-4" />
            Marcar entregado
          </Button>
          <AlertDialog open={deliveryConfirmationOpen} onOpenChange={setDeliveryConfirmationOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar entrega?</AlertDialogTitle>
                <AlertDialogDescription>
                  El pedido de {order.client_name_cache} quedará registrado como entregado. Si el cliente confirma más tarde desde su QR, también guardaremos esa confirmación.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelivery(order)}
                  disabled={isPending}
                >
                  Confirmar entrega
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {stage === "delivered" && (
        <p className="mt-3 flex items-center gap-2 rounded-md bg-emerald-500/10 px-2.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
          <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {order.customer_confirmed_at ? "Cliente confirmó por QR" : "Entrega registrada por el equipo"}
        </p>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="mt-2 h-11 w-full gap-2 text-primary">
            Ver detalle del pedido
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{order.id.slice(-6).toUpperCase()}</DialogTitle>
            <DialogDescription>{order.client_name_cache}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Productos a preparar</h4>
            {order.order_items.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Este pedido no tiene productos cargados.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border px-3">
                {productLines.map(item => (
                  <li key={item.id} className="flex min-h-12 items-center justify-between gap-4 py-2 text-sm">
                    <span className="min-w-0">{item.name}</span>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-1 font-bold tabular-nums">
                      {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {order.notes && (
              <p className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="font-semibold">Nota del pedido: </span>{order.notes}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Cantidades totales por producto, incluidas las unidades promocionales.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function OrdersKanbanBoard({
  orders,
  workload,
  showAmounts = true,
}: {
  orders: BoardOrders;
  workload: BoardWorkload;
  showAmounts?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [bundlesByOrder, setBundlesByOrder] = useState<Record<string, number>>({});
  const readyCount = Math.max(
    0,
    workload.pendingOrdersCount
      - workload.pendingWhatsAppCount
      - workload.pendingPreparationCount
      - workload.unprintedOrdersCount
  );
  const counts: Record<StageId, number> = {
    whatsapp: workload.pendingWhatsAppCount,
    preparation: workload.pendingPreparationCount,
    labels: workload.unprintedOrdersCount,
    ready: readyCount,
    dispatched: workload.dispatchedOrdersCount,
    delivered: workload.deliveredOrdersCount,
  };

  const handleRefresh = () => {
    startTransition(() => router.refresh());
  };

  const handleWorkflowStep = (orderId: string, step: "whatsapp" | "preparation") => {
    startTransition(async () => {
      const { error } = await markOrderWorkflowStep(orderId, step);
      if (error) {
        toast({
          title: "No se pudo actualizar el pedido",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: step === "whatsapp" ? "Recepción confirmada" : "Pedido preparado",
        description: step === "whatsapp"
          ? "El pedido avanzó a la etapa de preparación."
          : "El pedido avanzó a la etapa de etiquetado.",
      });
      router.refresh();
    });
  };

  const handleDispatch = (order: DashboardBoardOrder) => {
    startTransition(async () => {
      const { error } = await updateOrderStatus(order.id, "transito");
      if (error) {
        toast({
          title: error.code === "NOT_PRINTED" ? "Falta confirmar el rótulo" : "No se pudo despachar",
          description: error.message,
          variant: "destructive",
        });
        router.refresh();
        return;
      }

      toast({
        title: "Pedido despachado",
        description: `El pedido de ${order.client_name_cache} quedó en tránsito.`,
      });
      router.refresh();
    });
  };

  const handleDelivery = (order: DashboardBoardOrder) => {
    startTransition(async () => {
      const { error } = await updateOrderStatus(order.id, "entregado");
      if (error) {
        toast({
          title: "No se pudo confirmar la entrega",
          description: error.message,
          variant: "destructive",
        });
        router.refresh();
        return;
      }

      toast({
        title: "Entrega registrada",
        description: `El pedido de ${order.client_name_cache} quedó entregado. El cliente aún puede confirmar desde su QR.`,
      });
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="orders-kanban-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="orders-kanban-title" className="text-xl font-bold tracking-tight">Tablero de pedidos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada columna es el próximo paso. Avanzá los pedidos con acciones explícitas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-2"
            disabled={isPending}
            onClick={handleRefresh}
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            Actualizar
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 gap-2">
            <Link href="/admin/orders">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div
        className="-mx-4 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0"
        aria-label="Etapas del flujo de pedidos"
      >
        <div className="grid min-w-max grid-flow-col auto-cols-[minmax(272px,82vw)] gap-3 md:min-w-0 md:grid-flow-row md:grid-cols-2 md:auto-cols-auto 2xl:grid-cols-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const stageOrders = orders[stage.id];
            const style = stageStyles[stage.tone];
            return (
              <section key={stage.id} className="flex min-w-0 flex-col rounded-xl border bg-muted/20 p-2.5">
                <header className={cn("mb-2 rounded-lg border p-3", style.heading)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className={cn("h-4 w-4 shrink-0", style.icon)} aria-hidden="true" />
                      <h3 className="font-semibold leading-tight">{stage.title}</h3>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", style.count)}>
                      {counts[stage.id]}
                    </span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-muted-foreground">{stage.description}</p>
                </header>

                <div className="flex min-h-32 flex-1 flex-col gap-2">
                  {stageOrders.length > 0 ? (
                    stageOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        stage={stage.id}
                        isPending={isPending}
                        bundles={bundlesByOrder[order.id] ?? 1}
                        onBundlesChange={(orderId, value) => setBundlesByOrder((current) => ({
                          ...current,
                          [orderId]: Math.max(1, Math.min(20, value)),
                        }))}
                        onWorkflowStep={handleWorkflowStep}
                        onDispatch={handleDispatch}
                        onDelivery={handleDelivery}
                        showAmounts={showAmounts}
                      />
                    ))
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center">
                      <CircleCheck className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        {counts[stage.id] > 0 ? "No hay más pedidos en esta vista." : "Todo al día"}
                      </p>
                    </div>
                  )}
                  {counts[stage.id] > stageOrders.length && (
                    <Link
                      href={stage.href}
                      className="flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Ver {counts[stage.id] - stageOrders.length} pedidos más
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Las unidades incluyen productos promocionales. Los pedidos de más de 48 horas se marcan para priorizar su revisión.
      </p>
    </section>
  );
}
