
import { Landmark, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSalesConditions } from "@/app/admin/actions/sales-conditions.actions";
import SalesConditionsTable from "../../sales-conditions/_components/sales-conditions-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityDialog } from "../../_components/entity-dialog";
import { salesConditionFormConfig } from "../../sales-conditions/_components/form-config";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { ErrorDisplay } from "@/components/shared/error-display";

export default async function SalesConditionsTab() {
  const { data: salesConditions, error } = await getSalesConditions();

  if (error) {
    return <ErrorDisplay message={(error as any).message} />;
  }

  const emptyState = (
    <EmptyState
      icon={Landmark}
      title="No hay condiciones de venta"
      description="Crea tu primera condición para definir plazos de pago, descuentos o formas de financiación."
    >
      <EntityDialog formConfig={salesConditionFormConfig}>
        <Button variant="brand">
          <PlusCircle className="h-4 w-4" />
          Crear Condición
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <GlassCard>
      <GlassCardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <GlassCardTitle>Condiciones de Venta</GlassCardTitle>
            <GlassCardDescription>
              Plazos, financiación y logística.
            </GlassCardDescription>
          </div>
          <EntityDialog formConfig={salesConditionFormConfig}>
            <Button variant="brand" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                Crear Condición
              </span>
            </Button>
          </EntityDialog>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="p-0 sm:px-0">
        <SalesConditionsTable
          salesConditions={salesConditions ?? []}
          emptyState={emptyState}
        />
      </GlassCardContent>
    </GlassCard>
  );
}
