import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusConfig = {
  label: string;
  className: string;
};

type StatusBadgeProps = {
  status: string;
  config: Record<string, StatusConfig>;
  className?: string;
};

export function StatusBadge({ status, config, className }: StatusBadgeProps) {
  const statusConfig = config[status] || { label: status, className: "bg-muted text-muted-foreground" };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 whitespace-nowrap",
        statusConfig.className,
        className
      )}
    >
      {statusConfig.label}
    </Badge>
  );
}

export const orderStatusConfig: Record<string, StatusConfig> = {
  armado: { label: "Armado", className: "bg-secondary/20 text-secondary border-secondary/20" },
  transito: { label: "Despachado", className: "bg-primary/20 text-primary border-primary/20" },
  entregado: { label: "Conformado", className: "bg-green-500/10 text-green-500 border-green-500/20" },
};

export const clientStatusConfig: Record<string, StatusConfig> = {
  pending_onboarding: { label: "Pendiente de Alta", className: "bg-secondary/20 text-secondary border-secondary/20" },
  pending_agreement: { label: "Pendiente de Convenio", className: "bg-destructive/20 text-destructive border-destructive/20" },
  active: { label: "Activo", className: "bg-primary/20 text-primary border-primary/20" },
  archived: { label: "Archivado", className: "bg-muted text-muted-foreground border-muted" },
};
