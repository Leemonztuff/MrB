
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Users,
  FileText,
  Briefcase,
  History,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  isComplete?: (stats: DashboardStats) => boolean;
  incompleteTooltip?: string;
};

const navItems: NavItem[] = [
  { href: "/admin", icon: Home, label: "Dashboard" },
  { href: "/admin/orders", icon: History, label: "Pedidos" },
  { href: "/admin/products", icon: Package, label: "Productos" },
  { href: "/admin/clients", icon: Users, label: "Clientes" },
  { href: "/admin/agreements", icon: FileText, label: "Convenios" },
  { href: "/admin/commercial-settings", icon: Briefcase, label: "Comercial" },
];

export function AppNav({ isMobile, stats }: { isMobile: boolean, stats: DashboardStats }) {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin');

    const linkContent = (
      <>
        <item.icon className="h-5 w-5" />
        {isMobile ? item.label : <span className="sr-only">{item.label}</span>}
      </>
    );

    if (isMobile) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "relative flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
            isActive && "text-foreground"
          )}
        >
          {linkContent}
        </Link>
      )
    }

    return (
      <Tooltip key={item.href} delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-300 hover:text-primary hover:bg-primary/5 active:scale-90 md:h-9 md:w-9",
              isActive && "bg-primary/10 text-primary shadow-[0_0_20px_rgba(212,175,55,0.1)] after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-primary after:rounded-full"
            )}
          >
            {linkContent}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-bold border-primary/20 bg-background/95 backdrop-blur-md">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  if (isMobile) {
    return (
      <nav className="grid gap-6 text-base font-medium">
        {navItems.map(renderNavItem)}
      </nav>
    );
  }

  return (
    <TooltipProvider>
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        {navItems.map(renderNavItem)}
      </nav>
    </TooltipProvider>
  );
}
