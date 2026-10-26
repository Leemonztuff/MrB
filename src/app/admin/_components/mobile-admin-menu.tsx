"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logout } from "@/app/actions/user.actions";
import { AppNav } from "./app-nav";

export function MobileAdminMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 sm:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pt-16">
        <SheetHeader>
          <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
          <SheetDescription className="sr-only">
            Navegación principal de la aplicación para dispositivos móviles.
          </SheetDescription>
        </SheetHeader>
        <AppNav isMobile onNavigate={closeMenu} />
        <div className="absolute bottom-4 left-4 right-4 grid gap-4">
          <Link
            href="/admin/settings"
            onClick={closeMenu}
            className="flex min-h-11 items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Configuración
          </Link>
          <form action={logout}>
            <button
              type="submit"
              onClick={closeMenu}
              className="flex min-h-11 w-full items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
