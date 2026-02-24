
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
import { getNotificationData, getDashboardData } from "@/app/admin/actions/dashboard.actions";
import { getSettings } from "@/app/admin/actions/settings.actions";
import { AppNav } from "./_components/app-nav";
import type { DashboardStats } from "@/types";

const createNotifications = (
  pendingOrdersCount: number,
  pendingClientsCount: number,
  overdueOrdersCount: number
) => {
  const notifications = [];

  if (pendingOrdersCount > 0) {
    notifications.push({
      id: "pending-orders",
      type: "order" as const,
      title: `${pendingOrdersCount} Pedido(s) Nuevo(s)`,
      description: "Tienes nuevos pedidos para procesar.",
      createdAt: new Date(),
    });
  }

  if (pendingClientsCount > 0) {
    notifications.push({
      id: "pending-clients",
      type: "client" as const,
      title: `${pendingClientsCount} Cliente(s) Pendiente(s)`,
      description: "Nuevos clientes esperan asignación de convenio.",
      createdAt: new Date(),
    });
  }

  if (overdueOrdersCount > 0) {
    notifications.push({
      id: "overdue-orders",
      type: "overdue" as const,
      title: `${overdueOrdersCount} Pedido(s) Vencido(s)`,
      description: "Hay pedidos cuya gestión está demorada.",
      createdAt: new Date(),
    });
  }

  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pending_orders_count, pending_clients_count, overdue_orders_count } = await getNotificationData();
  const { stats } = await getDashboardData();
  const { logo_url } = await getSettings();

  const notifications = createNotifications(
    pending_orders_count,
    pending_clients_count,
    overdue_orders_count
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 py-5">
           <Link
            href="/admin"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold"
          >
            <Logo logoUrl={logo_url} />
            <span className="sr-only">MR. BLONDE</span>
          </Link>
          <AppNav isMobile={false} stats={stats as DashboardStats} />
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                    href="/admin/settings"
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
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
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-16">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="sm:hidden">
              <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold">
                <Logo logoUrl={logo_url} showText={true} />
              </Link>
            </div>
             <div className="ml-auto flex items-center gap-4">
                 <Notifications notifications={notifications} />
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
                          <AppNav isMobile={true} stats={stats as DashboardStats} />
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
