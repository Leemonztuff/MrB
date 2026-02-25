
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
import { Badge } from "@/components/ui/badge";
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
        description="Gestión pro de catálogo e inventario."
      >
        <div className="flex items-center gap-3">
          <ImportProductsDialog />
          <EntityDialog formConfig={productFormConfig}>
            <Button size="sm" className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
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
              <Card className="glass border-white/5 overflow-hidden">
                <CardHeader className="p-0">
                  <AccordionTrigger className="px-6 py-4 text-xl font-black italic tracking-tighter hover:no-underline hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-primary group-hover:scale-110 transition-transform">#</span>
                      {category}
                      <Badge variant="outline" className="ml-2 text-[10px] font-black tracking-widest bg-primary/5 border-primary/20 text-primary">
                        {productsByCategory[category].length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent className="p-0 border-t border-white/5 bg-black/20">
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
