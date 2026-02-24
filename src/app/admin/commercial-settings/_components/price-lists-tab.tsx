
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
    <Card>
      <CardHeader>
        <div className="flex items-center">
            <div className="flex-grow">
                <CardTitle>Listas de Precios</CardTitle>
                <CardDescription>
                    Crea y gestiona listas de precios reutilizables para tus convenios.
                </CardDescription>
            </div>
             <EntityDialog formConfig={priceListFormConfig}>
                <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Crear Lista
                </span>
                </Button>
            </EntityDialog>
        </div>
      </CardHeader>
      <CardContent>
        <PriceListsTable priceLists={priceLists ?? []} emptyState={emptyState} />
      </CardContent>
    </Card>
  );
}
