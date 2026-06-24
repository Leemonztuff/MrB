import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GlassCardProps = React.ComponentProps<typeof Card> & {
  variant?: "default" | "interactive" | "surface";
  noPadding?: boolean;
};

export function GlassCard({
  variant = "default",
  noPadding = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <Card
      className={cn(
        "glass border-white/5 overflow-hidden",
        variant === "interactive" && "hover:bg-white/5 transition-all duration-300 cursor-pointer",
        variant === "surface" && "bg-black/20",
        noPadding && "p-0",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function GlassCardHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("p-6", className)}
      {...props}
    />
  );
}

export function GlassCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn("text-xl font-black italic tracking-tighter", className)}
      {...props}
    />
  );
}

export function GlassCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>) {
  return (
    <CardDescription
      className={cn("text-xs uppercase font-bold tracking-widest opacity-60", className)}
      {...props}
    />
  );
}

export function GlassCardContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent
      className={cn("p-6", className)}
      {...props}
    />
  );
}
