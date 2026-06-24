
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openPrintPage } from "@/lib/print-helpers";

export function ShippingLabelButton({ orders }: { orders: { id: string, bundles: number }[] }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePrint = async () => {
    setLoading(true);
    try {
      openPrintPage(orders);
      toast({
        title: "Rótulos Generados",
        description: `Se han preparado ${orders.reduce((acc, o) => acc + o.bundles, 0)} rótulos para impresión.`,
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
