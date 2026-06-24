
import { ClipboardList, PlusCircle } from "lucide-react";
import { getPriceLists } from "@/app/admin/actions/pricelists.actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PriceListsTable } from "../../pricelists/_components/pricelists-table";
import { EntityDialog } from "../../_components/entity-dialog";
import { priceListFormConfig } from "../../pricelists/_components/form-config";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { ErrorDisplay } from "@/components/shared/error-display";

export default async function PriceListsTab() {
  const { data: priceLists, error } = await getPriceLists();

  if (error) {
    return <ErrorDisplay message={error.message} />;
  }

  const emptyState = (
    <EmptyState
      icon={ClipboardList}
      title="No hay listas de precios"
      description="Crea tu primera lista para empezar a definir precios para tus productos."
    >
      <EntityDialog formConfig={priceListFormConfig}>
        <Button variant="brand">
          <PlusCircle className="h-4 w-4" />
          Crear Lista de Precios
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <GlassCard>
      <GlassCardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <GlassCardTitle>Listas de Precios</GlassCardTitle>
            <GlassCardDescription>
              Estructura base de valores por producto.
            </GlassCardDescription>
          </div>
          <EntityDialog formConfig={priceListFormConfig}>
            <Button variant="brand" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                Crear Lista
              </span>
            </Button>
          </EntityDialog>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="p-0 sm:px-0">
        <PriceListsTable priceLists={priceLists ?? []} emptyState={emptyState} />
      </GlassCardContent>
    </GlassCard>
  );
}
