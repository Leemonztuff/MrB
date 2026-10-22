
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/formatters";

interface ConfirmSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  totalItems: number;
  totalPrice: number;
  isPending: boolean;
}

export function ConfirmSendDialog({
  open,
  onOpenChange,
  onConfirm,
  totalItems,
  totalPrice,
  isPending,
}: ConfirmSendDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black italic tracking-tighter">
            Enviar pedido
          </AlertDialogTitle>
          <AlertDialogDescription>
            Primero registraremos tu pedido de <strong>{totalItems} unidades</strong> por{" "}
            <strong>{formatCurrency(totalPrice)}</strong>. Después se abrirá WhatsApp con
            el mensaje preparado. Para completar el envío, tendrás que tocar{" "}
            <strong>Enviar</strong> en WhatsApp.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            {isPending ? "Registrando pedido..." : "Registrar y abrir WhatsApp"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
