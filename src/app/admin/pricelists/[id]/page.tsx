
import Link from "next/link";
import { ArrowLeft, Edit, FileWarning, Package, PlusCircle } from "lucide-react";
import { getPriceListById } from "@/app/admin/actions/pricelists.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PriceListProductsTable } from "./_components/pricelist-products-table";
import { AssignProductToPriceListDialog } from "./_components/assign-product-dialog";
import { EntityDialog } from "../../_components/entity-dialog";
import { priceListFormConfig } from "../_components/form-config";

export default async function PriceListDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: priceList, error } = await getPriceListById(params.id);

  if (error || !priceList) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <FileWarning className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-2xl font-bold tracking-tight">
            Lista de Precios no encontrada
          </h3>
          <p className="text-sm text-muted-foreground">
            No se pudo encontrar la lista solicitada.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/commercial-settings?tab=pricelists">Volver a Listas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/admin/commercial-settings?tab=pricelists">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{priceList.name}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <EntityDialog formConfig={priceListFormConfig} entity={priceList}>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Edit className="h-3.5 w-3.5" />
                    <span>Editar Detalles</span>
                </Button>
            </EntityDialog>
        </div>
      </div>
        <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="flex-grow">
            <CardTitle>Productos en la Lista</CardTitle>
            <CardDescription>
                Gestiona los productos y sus precios para esta lista.
            </CardDescription>
            </div>
            <AssignProductToPriceListDialog priceListId={priceList.id}>
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Asignar Productos</span>
                </Button>
            </AssignProductToPriceListDialog>
        </CardHeader>
        <CardContent>
            <PriceListProductsTable items={priceList.price_list_items} priceListId={priceList.id} />
        </CardContent>
        </Card>
    </div>
  );
}
