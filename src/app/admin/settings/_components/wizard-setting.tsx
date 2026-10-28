"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setWizardEnabled } from "@/app/admin/actions/wizard.actions";

export function WizardSetting({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (nextValue: boolean) => {
    setChecked(nextValue);
    startTransition(async () => {
      const result = await setWizardEnabled(nextValue);
      if (!result.success) {
        setChecked(!nextValue);
        toast({
          title: "No se pudo guardar",
          description: result.error?.message ?? "Intentá nuevamente.",
          variant: "destructive",
        });
        return;
      }

      if (nextValue) {
        localStorage.removeItem("mrb-wizard-autoclosed");
      }

      router.refresh();
      toast({
        title: nextValue ? "Guía activada" : "Guía desactivada",
        description: nextValue
          ? "La guía de inicio volverá a mostrarse en el panel."
          : "Podés volver a activarla cuando quieras desde Configuración.",
      });
    });
  };

  return (
    <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
      <Checkbox
        id="wizard-enabled"
        checked={checked}
        disabled={isPending}
        onCheckedChange={value => handleChange(value === true)}
      />
      <div className="space-y-1 leading-none">
        <Label htmlFor="wizard-enabled" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          Mostrar guía de inicio
        </Label>
        <p className="text-sm text-muted-foreground">
          Muestra una guía paso a paso para cargar productos, crear listas de precios,
          convenios, clientes y gestionar el primer pedido.
        </p>
        {isPending && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Guardando...
          </p>
        )}
      </div>
    </div>
  );
}
