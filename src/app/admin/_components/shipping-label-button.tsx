
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { bulkUpdateOrderStatus } from "@/app/admin/actions/orders.actions";
import { useToast } from "@/hooks/use-toast";

export function ShippingLabelButton({ orders }: { orders: { id: string, bundles: number }[] }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePrint = async () => {
    setLoading(true);
    try {
      // AUTOMACIÓN: Marcar pedidos como 'transito' (Despachado en el Badge)
      const orderIds = orders.map(o => o.id);
      const { error } = await bulkUpdateOrderStatus(orderIds, 'transito');

      if (error) {
        toast({
          title: "Advertencia",
          description: "Los rótulos se abrirán, pero no pudimos actualizar el estado de los pedidos.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Pedidos Despachados",
          description: `${orderIds.length} pedidos marcados como despachados.`,
        });
      }

      const data = JSON.stringify(orders);
      // Abrir la página de impresión en una nueva pestaña
      window.open(`/admin/imprimir/rotulos?data=${encodeURIComponent(data)}`, '_blank');

    } catch (err) {
      console.error("Error triggering print flow:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handlePrint}
      disabled={loading}
      className="gap-2 shadow-lg shadow-primary/20"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      {loading ? "Despachando..." : `Preparar Despacho (${orders.reduce((acc, o) => acc + o.bundles, 0)} bultos)`}
    </Button>
  );
}
