
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
      const data = JSON.stringify(orders);
      // Abrir la página de impresión en una nueva pestaña
      window.open(`/admin/imprimir/rotulos?data=${encodeURIComponent(data)}`, '_blank');

      toast({
        title: "Rótulos Generados",
        description: `Se han preparado ${orders.length} rótulos para impresión.`,
      });
    } catch (err) {
      console.error("Error triggering print flow:", err);
      toast({
        title: "Error",
        description: "No se pudo generar el flujo de impresión.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={loading}
      className="gap-2 glass border-white/10 hover:bg-white/5 transition-all"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      {loading ? "Generando..." : `Generar Rótulos (${orders.reduce((acc, o) => acc + o.bundles, 0)} bultos)`}
    </Button>
  );
}
