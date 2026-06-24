
import { Package, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/app/admin/actions/products.actions";
import ProductsTable from "./_components/products-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityDialog } from "../_components/entity-dialog";
import { productFormConfig } from "./_components/form-config";
import { ImportProductsDialog } from "./_components/import-dialog";
import { PageContainer } from "@/components/shared/page-container";
import { GlassCard, GlassCardHeader } from "@/components/shared/glass-card";
import { ErrorDisplay } from "@/components/shared/error-display";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

export default async function ProductsPage() {
  const { data: products, error } = await getProducts();

  if (error) {
    return <ErrorDisplay message={error.message} />;
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
        <Button variant="brand">
          <PlusCircle className="h-4 w-4" />
          Crear Producto
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Productos"
        description="Gestión pro de catálogo e inventario."
      >
        <div className="flex items-center gap-3">
          <ImportProductsDialog />
          <EntityDialog formConfig={productFormConfig}>
            <Button variant="brand" size="sm">
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
              <GlassCard>
                <GlassCardHeader className="p-0">
                  <AccordionTrigger className="px-6 py-4 text-xl font-black italic tracking-tighter hover:no-underline hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-primary group-hover:scale-110 transition-transform">#</span>
                      {category}
                      <Badge variant="outline" className="ml-2 text-[10px] font-black tracking-widest bg-primary/5 border-primary/20 text-primary">
                        {productsByCategory[category].length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                </GlassCardHeader>
                <AccordionContent className="p-0 border-t border-white/5 bg-black/20">
                  <ProductsTable
                    products={productsByCategory[category]}
                    emptyState={<></>}
                  />
                </AccordionContent>
              </GlassCard>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        emptyState
      )}
    </PageContainer>
  );
}
