
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
            Se registrara tu pedido de <strong>{totalItems} unidades</strong> por{" "}
            <strong>{formatCurrency(totalPrice)}</strong> y se abrira WhatsApp para
            enviarlo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            {isPending ? "Enviando..." : "Confirmar y Enviar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
