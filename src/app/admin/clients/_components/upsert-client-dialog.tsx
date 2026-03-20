
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
      <DialogContent className="flex h-[min(92vh,860px)] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <UpsertClientForm client={client} onSuccess={handleSuccess} onCancel={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
