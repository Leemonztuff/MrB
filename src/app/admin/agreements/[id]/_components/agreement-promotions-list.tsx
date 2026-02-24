"use client"

import { useTransition } from "react";
import type { AgreementPromotion } from "@/types";
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
import { unassignPromotionFromAgreement } from "@/app/admin/actions/agreements.actions";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const formatRule = (rules: any): string => {
  if (!rules || typeof rules !== 'object') {
    return 'Regla no definida';
  }

  switch (rules.type) {
    case 'buy_x_get_y_free':
      return `Llevando ${rules.buy || 'X'} unidades, obtienes ${rules.get || 'Y'} de regalo.`;
    case 'free_shipping':
      return `Envío gratis con ${rules.min_units || 'X'} unidades o más.`;
    default:
      return 'Regla personalizada.';
  }
};

export default function AgreementPromotionsList({ promotions, agreementId }: { promotions: AgreementPromotion[], agreementId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  if (promotions.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <p>No hay promociones asignadas a este convenio.</p>
            <p className="text-sm">Usa el botón "Asignar Promoción" para empezar.</p>
        </div>
    )
  }

  const handleUnassign = (promotionId: string) => {
    startTransition(async () => {
      const result = await unassignPromotionFromAgreement({ agreement_id: agreementId, promotion_id: promotionId });
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Promoción desasignada correctamente." });
      }
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map(item => (
            <Card key={item.promotions.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex-grow">
                        <CardTitle className="text-base font-medium">{item.promotions.name}</CardTitle>
                        <CardDescription className="text-xs pt-1">
                            {item.promotions.description}
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
                            Esta acción quitará la promoción de este convenio.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUnassign(item.promotions.id)}
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
                        <p>{formatRule(item.promotions.rules)}</p>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );
}
