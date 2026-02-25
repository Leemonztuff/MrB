
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status, className }: { status: string, className?: string }) {
  const configs: Record<string, { label: string, className: string }> = {
    armado: { label: "Armado", className: "bg-secondary/20 text-secondary border-secondary/20" },
    transito: { label: "Despachado", className: "bg-primary/20 text-primary border-primary/20" },
    entregado: { label: "Conformado", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  };

  const config = configs[status] || { label: status, className: "bg-muted text-muted-foreground" };

  return (
    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 whitespace-nowrap", config.className, className)}>
      {config.label}
    </Badge>
  );
}
