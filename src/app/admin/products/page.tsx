
import { Package, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/app/admin/actions/products.actions";
import ProductsTable from "./_components/products-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityDialog } from "../_components/entity-dialog";
import { productFormConfig } from "./_components/form-config";
import { ImportProductsDialog } from "./_components/import-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { Product } from "@/types";

export default async function ProductsPage() {
  const { data: products, error } = await getProducts();

  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  const productsByCategory = (products ?? []).reduce((acc, product) => {
    const category = product.category || "Sin Categoría";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categories = Object.keys(productsByCategory);

  const emptyState = (
    <EmptyState
      icon={Package}
      title="No hay productos"
      description="Aún no has creado ningún producto. ¡Empieza por añadir el primero!"
    >
      <EntityDialog formConfig={productFormConfig}>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Producto
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <PageHeader
        title="Productos"
        description="Gestiona tu catálogo de productos y su inventario."
      >
        <div className="flex items-center gap-2">
          <ImportProductsDialog />
          <EntityDialog formConfig={productFormConfig}>
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Agregar Producto
              </span>
            </Button>
          </EntityDialog>
        </div>
      </PageHeader>

      {products && products.length > 0 ? (
        <Accordion
          type="multiple"
          defaultValue={categories}
          className="w-full space-y-4"
        >
          {categories.map((category) => (
            <AccordionItem
              key={category}
              value={category}
              className="border-none"
            >
              <Card>
                <CardHeader className="p-4">
                  <AccordionTrigger className="p-2 -m-2 text-xl font-bold hover:no-underline">
                    {category}
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent className="px-0 pb-0">
                  <ProductsTable
                    products={productsByCategory[category]}
                    emptyState={<></>}
                  />
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        emptyState
      )}
    </div>
  );
}
