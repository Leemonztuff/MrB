
import { ClipboardList, PlusCircle } from "lucide-react";
import { getPriceLists } from "@/app/admin/actions/pricelists.actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PriceListsTable } from "../../pricelists/_components/pricelists-table";
import { EntityDialog } from "../../_components/entity-dialog";
import { priceListFormConfig } from "../../pricelists/_components/form-config";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default async function PriceListsTab() {
  const { data: priceLists, error } = await getPriceLists();

  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  const emptyState = (
    <EmptyState
      icon={ClipboardList}
      title="No hay listas de precios"
      description="Crea tu primera lista para empezar a definir precios para tus productos."
    >
      <EntityDialog formConfig={priceListFormConfig}>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Lista de Precios
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <Card className="glass border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <CardTitle className="text-xl font-black italic tracking-tighter">Listas de Precios</CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
              Estructura base de valores por producto.
            </CardDescription>
          </div>
          <EntityDialog formConfig={priceListFormConfig}>
            <Button size="sm" className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                Crear Lista
              </span>
            </Button>
          </EntityDialog>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:px-0">
        <PriceListsTable priceLists={priceLists ?? []} emptyState={emptyState} />
      </CardContent>
    </Card>
  );
}
