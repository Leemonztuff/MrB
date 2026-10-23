
import Link from "next/link";
import {
  LogOut,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/app/logo";
import { logout } from "@/app/actions/user.actions";
import { Notifications } from "./_components/notifications";
import { getNotificationData } from "@/app/admin/actions/dashboard.actions";
import { getSettings } from "@/app/admin/actions/settings.actions";
import { AppNav } from "./_components/app-nav";
import { AutoRefresh } from "./_components/auto-refresh";
import { ThemeToggle } from "./_components/theme-toggle";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const createNotifications = (
  pendingOrdersCount: number,
  pendingClientsCount: number,
  overdueOrdersCount: number,
  oldestPendingOrderAt: string | null
) => {
  const notifications = [];

  if (pendingOrdersCount > 0) {
    notifications.push({
      id: "pending-orders",
      type: "order" as const,
      title: `${pendingOrdersCount} ${pendingOrdersCount === 1 ? "pedido pendiente" : "pedidos pendientes"}`,
      description: oldestPendingOrderAt
        ? `El más antiguo se creó ${formatDistanceToNow(new Date(oldestPendingOrderAt), { addSuffix: true, locale: es })}.`
        : "Pendientes de preparación o despacho.",
      href: "/admin/orders?status=armado",
    });
  }

  if (pendingClientsCount > 0) {
    notifications.push({
      id: "pending-clients",
      type: "client" as const,
      title: `${pendingClientsCount} ${pendingClientsCount === 1 ? "cliente pendiente" : "clientes pendientes"}`,
      description: "Esperan la asignación de un convenio.",
      href: "/admin/clients",
    });
  }

  if (overdueOrdersCount > 0) {
    notifications.push({
      id: "overdue-orders",
      type: "overdue" as const,
      title: `${overdueOrdersCount} ${overdueOrdersCount === 1 ? "pedido demorado" : "pedidos demorados"}`,
      description: "Pendientes de despacho desde hace más de 48 horas.",
      href: "/admin/orders?status=armado&overdue=true",
    });
  }

  return notifications;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notificationResult, settingsResult] = await Promise.all([
    getNotificationData(),
    getSettings(),
  ]);
  const notificationData = notificationResult.data;
  const { logo_url } = settingsResult;

  const notifications = notificationData
    ? createNotifications(
        notificationData.pending_orders_count,
        notificationData.pending_clients_count,
        notificationData.overdue_orders_count,
        notificationData.oldest_pending_order_at
      )
    : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background/95">
      <AutoRefresh />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col glass border-r-0 sm:flex shadow-none">
        <nav className="flex flex-col items-center gap-6 px-2 py-8">
          <Link
            href="/admin"
            className="group flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary/10 transition-all hover:bg-primary/20 active:scale-95"
          >
            <Logo logoUrl={logo_url} />
            <span className="sr-only">MR. BLONDE</span>
          </Link>
          <AppNav isMobile={false} />
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-6 px-2 py-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/settings"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:text-primary hover:bg-primary/5 active:scale-95"
                  )}
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Configuración</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Configuración</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                                  <form action={logout}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/5 active:scale-95"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Cerrar Sesión</span>
                  </Button>
                </form>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar Sesión</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:pl-20">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 glass border-b-0 border-white/5 px-4 sm:static sm:h-auto sm:bg-transparent sm:px-8 sm:py-6 sm:backdrop-blur-none">
          <div className="sm:hidden">
            <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold">
              <Logo logoUrl={logo_url} showText={true} />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <Notifications
              notifications={notifications}
              error={notificationResult.error?.message}
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 sm:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="pt-16">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                  <SheetDescription className="sr-only">Navegación principal de la aplicación para dispositivos móviles.</SheetDescription>
                </SheetHeader>
                <nav className="grid gap-6 text-base font-medium">
                  <AppNav isMobile={true} />
                </nav>
                <div className="absolute bottom-4 left-4 right-4 grid gap-4">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    Configuración
                  </Link>
                  <form action={logout}>
                    <button className="w-full flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                      <LogOut className="h-5 w-5" />
                      Cerrar Sesión
                    </button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-24 sm:pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}
