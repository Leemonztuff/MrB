
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openPrintPage } from "@/lib/print-helpers";

export function ShippingLabelButton({
  orders,
  onClick,
  compact = false,
}: {
  orders: { id: string, bundles: number }[];
  onClick?: () => void;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePrint = async () => {
    setLoading(true);
    try {
      const opened = openPrintPage(orders);
      if (!opened) {
        toast({
          title: "No se abrió la vista de rótulos",
          description: "Permití las ventanas emergentes para este sitio y volvé a intentarlo.",
          variant: "destructive"
        });
        return;
      }
      onClick?.();
      toast({
        title: "Vista de rótulos abierta",
        description: `Se abrió la vista con ${orders.reduce((acc, o) => acc + o.bundles, 0)} rótulos de envío.`,
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
      className={compact
        ? "h-11 min-w-0 flex-1 gap-2 px-2 text-xs glass border-white/10 hover:bg-white/5 transition-all"
        : "gap-2 glass border-white/10 hover:bg-white/5 transition-all"}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      {loading
        ? "Generando..."
        : compact
          ? "Imprimir rótulo"
          : `Imprimir Rótulos de Envío (${orders.reduce((acc, o) => acc + o.bundles, 0)} bultos)`}
    </Button>
  );
}
