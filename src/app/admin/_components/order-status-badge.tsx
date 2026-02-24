
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status, className }: { status: string, className?: string }) {
  const configs: Record<string, { label: string, variant: any }> = {
    armado: { label: "Armado", variant: "secondary" },
    transito: { label: "Despachado", variant: "default" },
    entregado: { label: "Conformado", variant: "outline" },
  };

  const config = configs[status] || { label: status, variant: "secondary" };

  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {config.label}
    </Badge>
  );
}
