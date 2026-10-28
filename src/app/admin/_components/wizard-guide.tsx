"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  GraduationCap,
  ListChecks,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { setWizardEnabled } from "@/app/admin/actions/wizard.actions";
import { getWizardProgress, type WizardStep } from "@/lib/wizard";
import { cn } from "@/lib/utils";

export function WizardGuide({ steps }: { steps: WizardStep[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const progress = getWizardProgress(steps);

  useEffect(() => {
    if (progress.isComplete) return;
    if (localStorage.getItem("mrb-wizard-autoclosed") === "1") return;
    setOpen(true);
  }, [progress.isComplete]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      router.refresh();
      return;
    }
    localStorage.setItem("mrb-wizard-autoclosed", "1");
  };

  const handleDisable = () => {
    startTransition(async () => {
      const result = await setWizardEnabled(false);
      if (!result.success) {
        toast({
          title: "No se pudo ocultar la guía",
          description: result.error?.message ?? "Intentá nuevamente.",
          variant: "destructive",
        });
        return;
      }

      setOpen(false);
      router.refresh();
      toast({
        title: "Guía ocultada",
        description: "Podés volver a activarla desde Configuración.",
      });
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="brand"
          className="fixed bottom-24 right-4 z-40 h-11 gap-2 rounded-full px-4 shadow-xl shadow-primary/20 sm:bottom-6 sm:right-6"
        >
          {progress.isComplete ? (
            <Check className="h-4 w-4" />
          ) : (
            <GraduationCap className="h-4 w-4" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {progress.isComplete ? "Guía completada" : "Guía de inicio"}
          </span>
          <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-black">
            {progress.completed}/{progress.total}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b p-6 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>Guía de inicio</SheetTitle>
              <SheetDescription>
                {progress.isComplete
                  ? "Ya completaste los primeros pasos. Podés desactivar la guía desde Configuración."
                  : "Seguí estos pasos para dejar tu cuenta lista para recibir pedidos."}
              </SheetDescription>
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {progress.completed} de {progress.total} pasos completados
            </p>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {steps.map((step, index) => {
            const isCurrent = step.id === progress.next?.id;
            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  step.completed && "bg-muted/30 opacity-70",
                  isCurrent && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                      step.completed
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.completed ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold">{step.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant={isCurrent ? "brand" : "ghost"}
                      className="mt-2 h-8 gap-1 px-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Link href={step.href} onClick={() => handleOpenChange(false)}>
                        {isCurrent ? "Ir a este paso" : "Abrir sección"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-bold">Cómo sigue el flujo de trabajo</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>El cliente completa su alta y envía el pedido desde su enlace personal.</li>
              <li>Confirmás el pedido por WhatsApp.</li>
              <li>Preparás la mercadería e imprimís el rótulo.</li>
              <li>Despachás el pedido y el cliente confirma la recepción.</li>
            </ol>
          </div>
        </div>

        <div className="space-y-2 border-t p-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleDisable}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ocultar guía
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Podés activarla o desactivarla desde{" "}
            <Link
              href="/admin/settings"
              onClick={() => handleOpenChange(false)}
              className="underline underline-offset-2"
            >
              Configuración
            </Link>
            .
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
