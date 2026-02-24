
import { Landmark, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSalesConditions } from "@/app/admin/actions/sales-conditions.actions";
import SalesConditionsTable from "../../sales-conditions/_components/sales-conditions-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityDialog } from "../../_components/entity-dialog";
import { salesConditionFormConfig } from "../../sales-conditions/_components/form-config";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default async function SalesConditionsTab() {
  const { data: salesConditions, error } = await getSalesConditions();

  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  const emptyState = (
    <EmptyState
      icon={Landmark}
      title="No hay condiciones de venta"
      description="Crea tu primera condición para definir plazos de pago, descuentos o formas de financiación."
    >
      <EntityDialog formConfig={salesConditionFormConfig}>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Condición
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <Card>
       <CardHeader>
        <div className="flex items-center">
            <div className="flex-grow">
                <CardTitle>Condiciones de Venta</CardTitle>
                <CardDescription>
                   Gestiona las condiciones comerciales como plazos de pago, descuentos y financiación.
                </CardDescription>
            </div>
            <EntityDialog formConfig={salesConditionFormConfig}>
                <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Crear Condición
                </span>
                </Button>
            </EntityDialog>
        </div>
      </CardHeader>
      <CardContent>
        <SalesConditionsTable
          salesConditions={salesConditions ?? []}
          emptyState={emptyState}
        />
      </CardContent>
    </Card>
  );
}
