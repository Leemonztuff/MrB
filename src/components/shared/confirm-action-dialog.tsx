"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmActionDialogProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  pendingLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
};

export function ConfirmActionDialog({
  children,
  title,
  description,
  confirmLabel = "Confirmar",
  pendingLabel = "Procesando...",
  variant = "destructive",
  onConfirm,
}: ConfirmActionDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      onConfirm();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="glass border-white/5">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black italic">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 rounded-xl"
                : "bg-primary hover:bg-primary/90 rounded-xl"
            }
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
