"use client"

import { useTransition } from "react";
import type { AgreementSalesCondition } from "@/types";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { unassignSalesConditionFromAgreement } from "@/app/admin/actions/agreements.actions";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const formatRule = (rules: any): string => {
  if (!rules || typeof rules !== 'object') {
    return 'Regla no definida';
  }

  const { type, days, percentage, installments } = rules;

  switch (type) {
    case 'net_days':
      return `Plazo de pago: ${days || 'N/D'} días netos.`;
    case 'discount':
      return `Descuento por pronto pago: ${percentage || 'N/D'}%.`;
    case 'installments':
        return `Financiación: ${installments || 'N/D'} cuotas.`;
    default:
      return 'Regla personalizada.';
  }
};


export default function AgreementSalesConditionsList({ conditions, agreementId }: { conditions: AgreementSalesCondition[], agreementId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  if (conditions.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <p>No hay condiciones de venta asignadas a este convenio.</p>
            <p className="text-sm">Usa el botón "Asignar" para empezar.</p>
        </div>
    )
  }

  const handleUnassign = (conditionId: string) => {
    startTransition(async () => {
      const result = await unassignSalesConditionFromAgreement({ agreement_id: agreementId, sales_condition_id: conditionId });
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Condición desasignada correctamente." });
      }
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {conditions.map(item => (
            <Card key={item.sales_conditions.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex-grow">
                        <CardTitle className="text-base font-medium">{item.sales_conditions.name}</CardTitle>
                        <CardDescription className="text-xs pt-1">
                            {item.sales_conditions.description}
                        </CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Desasignar</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción quitará la condición de este convenio.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUnassign(item.sales_conditions.id)}
                            disabled={isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isPending ? "Desasignando..." : "Confirmar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent>
                    <div className="mt-2 text-sm bg-muted/50 p-3 rounded-md text-muted-foreground">
                        <p className="font-semibold text-foreground">Regla Aplicada:</p>
                        <p>{formatRule(item.sales_conditions.rules)}</p>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );
}
