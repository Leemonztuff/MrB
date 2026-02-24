
import { Percent, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPromotions } from "@/app/admin/actions/promotions.actions";
import PromotionsTable from "../../promotions/_components/promotions-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityDialog } from "../../_components/entity-dialog";
import { promotionFormConfig } from "../../promotions/_components/form-config";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default async function PromotionsTab() {
  const { data: promotions, error } = await getPromotions();

  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  const emptyState = (
    <EmptyState
      icon={Percent}
      title="No hay promociones"
      description="Aún no has creado ninguna promoción. ¡Crea la primera para ofrecer beneficios a tus clientes!"
    >
      <EntityDialog formConfig={promotionFormConfig}>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Promoción
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
            <div className="flex-grow">
                <CardTitle>Promociones</CardTitle>
                <CardDescription>
                   Gestiona las promociones y reglas de negocio de la tienda.
                </CardDescription>
            </div>
            <EntityDialog formConfig={promotionFormConfig}>
                <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Crear Promoción
                </span>
                </Button>
            </EntityDialog>
        </div>
      </CardHeader>
      <CardContent>
        <PromotionsTable promotions={promotions ?? []} emptyState={emptyState} />
      </CardContent>
    </Card>
  );
}
