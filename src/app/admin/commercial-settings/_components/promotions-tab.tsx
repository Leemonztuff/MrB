
import { Percent, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPromotions } from "@/app/admin/actions/promotions.actions";
import PromotionsTable from "../../promotions/_components/promotions-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityDialog } from "../../_components/entity-dialog";
import { promotionFormConfig } from "../../promotions/_components/form-config";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { ErrorDisplay } from "@/components/shared/error-display";

export default async function PromotionsTab() {
  const { data: promotions, error } = await getPromotions();

  if (error) {
    return <ErrorDisplay message={(error as any).message} />;
  }

  const emptyState = (
    <EmptyState
      icon={Percent}
      title="No hay promociones"
      description="Aún no has creado ninguna promoción. ¡Crea la primera para ofrecer beneficios a tus clientes!"
    >
      <EntityDialog formConfig={promotionFormConfig}>
        <Button variant="brand">
          <PlusCircle className="h-4 w-4" />
          Crear Promoción
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <GlassCard>
      <GlassCardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <GlassCardTitle>Promociones</GlassCardTitle>
            <GlassCardDescription>
              Reglas dinámicas y beneficios por volumen.
            </GlassCardDescription>
          </div>
          <EntityDialog formConfig={promotionFormConfig}>
            <Button variant="brand" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                Crear Promoción
              </span>
            </Button>
          </EntityDialog>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="p-0 sm:px-0">
        <PromotionsTable promotions={promotions ?? []} emptyState={emptyState} />
      </GlassCardContent>
    </GlassCard>
  );
}
