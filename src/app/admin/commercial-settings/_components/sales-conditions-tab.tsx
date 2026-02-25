
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
    return <p className="text-destructive">{(error as any).message}</p>;
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
    <Card className="glass border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <CardTitle className="text-xl font-black italic tracking-tighter">Condiciones de Venta</CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
              Plazos, financiación y logística.
            </CardDescription>
          </div>
          <EntityDialog formConfig={salesConditionFormConfig}>
            <Button size="sm" className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                Crear Condición
              </span>
            </Button>
          </EntityDialog>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:px-0">
        <SalesConditionsTable
          salesConditions={salesConditions ?? []}
          emptyState={emptyState}
        />
      </CardContent>
    </Card>
  );
}
