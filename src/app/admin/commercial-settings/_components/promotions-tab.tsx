
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
    return <p className="text-destructive">{(error as any).message}</p>;
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
    <Card className="glass border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <CardTitle className="text-xl font-black italic tracking-tighter">Promociones</CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
              Reglas dinámicas y beneficios por volumen.
            </CardDescription>
          </div>
          <EntityDialog formConfig={promotionFormConfig}>
            <Button size="sm" className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                Crear Promoción
              </span>
            </Button>
          </EntityDialog>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:px-0">
        <PromotionsTable promotions={promotions ?? []} emptyState={emptyState} />
      </CardContent>
    </Card>
  );
}
