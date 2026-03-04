
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UpsertClientForm } from "./upsert-client-form";
import type { Client } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

export function UpsertClientDialog({
  children,
  client,
}: {
  children: React.ReactNode;
  client?: Client;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  const dialogTitle = client ? `Editar Cliente` : "Crear Nuevo Cliente";
  const dialogDescription = client
    ? `Actualiza los detalles de ${client.contact_name}.`
    : "Completa el formulario para registrar un nuevo cliente en el sistema.";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 min-h-0">
          <div className="pb-6 pr-3">
            <UpsertClientForm client={client} onSuccess={handleSuccess} onCancel={() => setIsOpen(false)} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
