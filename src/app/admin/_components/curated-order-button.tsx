'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { FileText, Loader2, Printer, X } from 'lucide-react';
import type { Order, OrderWithItems } from '@/types';
import { getOrdersBatch } from '@/app/admin/actions/orders.actions';
import { getPublicLabelLogoUrl, getPublicLogoUrl } from '@/app/admin/actions/settings.actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CuratedOrderDocument } from './curated-order-pdf';

function CuratedOrdersPreview({
  orders,
  logoUrl,
}: {
  orders: OrderWithItems[];
  logoUrl: string | null;
}) {
  const document = useMemo(
    () => <CuratedOrderDocument orders={orders} logoUrl={logoUrl} />,
    [orders, logoUrl]
  );
  const [instance, update] = usePDF({ document });

  useEffect(() => {
    update(document);
  }, [document, update]);

  const handlePrint = () => {
    if (!instance.url) return;
    const iframe = window.document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
    });
    iframe.src = instance.url;
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => iframe.remove(), 3000);
    };
    window.document.body.appendChild(iframe);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white">
      {instance.error ? (
        <p role="alert" className="p-6 text-sm text-red-700">
          No se pudo generar la vista previa: {instance.error}
        </p>
      ) : instance.url ? (
        <iframe
          title="Vista previa de órdenes de preparación"
          src={`${instance.url}#toolbar=0&navpanes=0&statusbar=0`}
          className="h-[55vh] w-full border-0"
        />
      ) : (
        <div className="flex h-56 items-center justify-center gap-2 text-sm text-gray-500" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando vista previa...
        </div>
      )}
      <div className="flex justify-end border-t border-gray-200 p-3">
        <Button
          onClick={handlePrint}
          disabled={!instance.url}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" />
          Imprimir ({orders.length})
        </Button>
      </div>
    </div>
  );
}

export function CuratedOrderButton({
  initialOrderIds,
  availableOrders,
  iconOnly = false,
}: {
  initialOrderIds: string[];
  availableOrders: Order[];
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedOrders = useMemo(
    () => orders.filter(order => selectedIds.includes(order.id)),
    [orders, selectedIds]
  );
  useEffect(() => {
    if (!open || requestedIds.length === 0) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [ordersResult, labelLogoResult, logoResult] = await Promise.all([
          getOrdersBatch(requestedIds),
          getPublicLabelLogoUrl(),
          getPublicLogoUrl(),
        ]);

        if (ordersResult.error || !ordersResult.data) {
          throw new Error(ordersResult.error?.message || 'No se pudieron cargar los pedidos.');
        }
        if (labelLogoResult.error) throw new Error(labelLogoResult.error.message);
        if (logoResult.error) throw new Error(logoResult.error.message);

        if (!cancelled) {
          setOrders(ordersResult.data);
          setLogoUrl(labelLogoResult.data ?? logoResult.data ?? null);
        }
      } catch (loadError) {
        const message = loadError instanceof Error
          ? loadError.message
          : 'No se pudieron preparar las órdenes.';
        if (!cancelled) {
          setError(message);
          toast({ title: 'Error al preparar las órdenes', description: message, variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, requestedIds, toast]);

  const handleOpen = () => {
    const ids = [...new Set(initialOrderIds)];
    setRequestedIds([...new Set(availableOrders.map(order => order.id))]);
    setSelectedIds(ids);
    setOrders([]);
    setOpen(true);
  };

  const toggleOrder = (orderId: string) => {
    setSelectedIds(current => current.includes(orderId)
      ? current.filter(id => id !== orderId)
      : [...current, orderId]);
  };

  return (
    <>
      <Button
        type="button"
        variant={iconOnly ? 'outline' : 'secondary'}
        size={iconOnly ? 'icon' : 'sm'}
        className={iconOnly
          ? 'h-9 w-9 sm:h-10 sm:w-10 glass border-white/10 hover:bg-white/5 rounded-xl'
          : 'gap-2'}
        title="Orden de preparación: sirve para armar el pedido, no habilita el despacho"
        aria-label="Imprimir orden de preparación"
        onClick={handleOpen}
      >
        <FileText className="h-4 w-4" />
        {!iconOnly && 'Preparación'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto glass border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Órdenes de preparación
            </DialogTitle>
            <DialogDescription>
              Seleccioná los pedidos que querés acumular. Se imprimen dos órdenes A5 por hoja A4.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground" aria-live="polite">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando pedidos...
            </div>
          ) : error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pedidos disponibles
                </p>
                <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-2">
                  {orders.map(order => (
                    <label
                      key={order.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-white/5"
                    >
                      <Checkbox
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={() => toggleOrder(order.id)}
                        aria-label={`Incluir pedido de ${order.client_name_cache}`}
                      />
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-semibold">{order.client_name_cache}</span>
                        <span className="text-xs text-muted-foreground">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </span>
                    </label>
                  ))}
                  {orders.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">No hay pedidos disponibles.</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedOrders.length} pedido(s) seleccionados · {Math.ceil(selectedOrders.length / 2)} hoja(s)
                </p>
              </div>

              <div className="min-h-56">
                {selectedOrders.length === 0 ? (
                  <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-gray-500">
                    Seleccioná al menos un pedido para generar la vista previa.
                  </div>
                ) : (
                  <CuratedOrdersPreview orders={selectedOrders} logoUrl={logoUrl} />
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpen(false)} className="gap-2">
              <X className="h-4 w-4" />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
