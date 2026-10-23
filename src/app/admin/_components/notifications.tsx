"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Loader2, Package, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: "order" | "client" | "overdue";
  title: string;
  description: string;
  href: string;
};

const notificationStyles = {
  order: {
    icon: Package,
    color: "text-blue-500",
    background: "bg-blue-500/10",
  },
  client: {
    icon: UserPlus,
    color: "text-green-500",
    background: "bg-green-500/10",
  },
  overdue: {
    icon: Clock,
    color: "text-amber-500",
    background: "bg-amber-500/10",
  },
};

export function Notifications({
  notifications,
  error,
}: {
  notifications: Notification[];
  error?: string;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const hasActiveNotifications = notifications.length > 0;
  const triggerLabel = error
    ? "Abrir notificaciones; no se pudieron cargar"
    : hasActiveNotifications
      ? `Abrir notificaciones; ${notifications.length} ${notifications.length === 1 ? "categoría activa" : "categorías activas"}`
      : "Abrir notificaciones";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-11 w-11 shrink-0"
          aria-label={triggerLabel}
        >
          <Bell className="h-5 w-5" />
          {(hasActiveNotifications || error) && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute right-1.5 top-1.5 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                error ? "bg-destructive" : "bg-amber-500"
              )}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Avisos</CardTitle>
            <CardDescription>
              Pendientes actuales; desaparecen cuando se resuelven.
            </CardDescription>
          </CardHeader>
          <ScrollArea className="max-h-96">
            <CardContent className="grid gap-2 px-3 pb-3">
              {error ? (
                <div role="alert" className="grid gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-foreground">
                    No se pudieron cargar los avisos. Revisá la conexión e intentá nuevamente.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    onClick={() => startRefresh(() => router.refresh())}
                    className="w-fit gap-2"
                  >
                    {isRefreshing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isRefreshing ? "Actualizando..." : "Reintentar"}
                  </Button>
                </div>
              ) : hasActiveNotifications ? (
                notifications.map((notification) => {
                  const { icon: Icon, color, background } = notificationStyles[notification.type];
                  return (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", background)}>
                        <Icon className={cn("h-4 w-4", color)} aria-hidden="true" />
                      </span>
                      <span className="grid min-w-0 gap-1">
                        <span className="text-sm font-semibold">{notification.title}</span>
                        <span className="text-xs leading-relaxed text-muted-foreground">{notification.description}</span>
                        <span className="text-xs font-medium text-primary">Ver pendientes</span>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div role="status" className="grid justify-items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8" aria-hidden="true" />
                  <p>No hay pendientes activos.</p>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
