import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

type DataTableHeaderProps = {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
};

export function DataTableHeader({ children, className, align = "left" }: DataTableHeaderProps) {
  return (
    <TableHead
      className={cn(
        "text-[10px] font-black uppercase tracking-widest py-4",
        align === "left" && "pl-6",
        align === "right" && "text-right pr-6",
        className
      )}
    >
      {children}
    </TableHead>
  );
}

export function DataTableHeaderActions({ className }: { className?: string }) {
  return (
    <TableHead className={cn("text-right pr-6", className)}>
      <span className="sr-only">Acciones</span>
    </TableHead>
  );
}
