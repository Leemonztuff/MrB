
import { getOrderPageData } from "@/app/actions/user.actions";
import { ProductCard } from "./_components/product-card";
import { Logo } from "@/app/logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Package2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OrderSummary } from "./_components/order-summary";
import { MobileCartIndicator } from "./_components/mobile-cart-indicator";
import { Suspense } from "react";
import { AgreementPromotion, ProductWithPrice } from "@/types";

const categoryTranslations: Record<string, string> = {
  "Wax": "Ceras",
  "Powder": "Polvos",
  "Shaving": "Afeitado",
  "Hairstyle": "Cabello",
  "Facial & Beard": "Barba",
  "Shampoo & Conditioners": "Shampoo y Acondicionadores",
};

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error } = await getOrderPageData(params.id);

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-8">
          <Logo showText={true} logoUrl={null} />
        </div>
        <Card className="max-w-md mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertTriangle />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">{error?.message || "Algo salió mal."}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Por favor, contacta al administrador o solicita un nuevo enlace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { agreement, client, productsByCategory, vatPercentage, logoUrl } = data;
  const categories = Object.keys(productsByCategory);
  const promotions = agreement.agreement_promotions.map((ap: AgreementPromotion) => ap.promotions);

  const formatCategoryTitle = (category: string) => {
    const translation = categoryTranslations[category];
    if (!translation) {
      return category;
    }

    // Explicitly handle the special formats
    if (category === 'Hairstyle') {
      return `Hairstyle / ${translation}`;
    }
    if (category === 'Facial & Beard') {
      return `Facial & Beard / ${translation}`;
    }

    // Fallback for other translations
    return translation;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo showText={true} logoUrl={logoUrl} />
          <div className="text-right">
            <p className="font-semibold text-foreground">{client?.contact_name ?? "Cliente"}</p>
            <p className="text-sm capitalize text-muted-foreground">{agreement.agreement_name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start p-4 lg:p-8">
        {/* Columna Izquierda: Productos */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Productos</h2>
            <p className="mt-1 text-lg text-muted-foreground">Ajusta las cantidades que deseas ordenar.</p>
          </div>

          {categories.length > 0 ? (
            <Accordion type="multiple" defaultValue={categories} className="w-full space-y-4">
              {categories.map((category) => (
                <AccordionItem key={category} value={category} className="border-none">
                  <Card>
                    <CardHeader className="p-4">
                      <AccordionTrigger className="p-2 -m-2 text-xl font-bold hover:no-underline">
                        {formatCategoryTitle(category)}
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className="px-4 pb-4">
                      <div className="flex flex-col gap-4">
                        {productsByCategory[category].map((product: ProductWithPrice) => (
                          <ProductCard key={product.id} product={product} promotions={promotions} />
                        ))}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="mt-6 flex flex-col items-center justify-center py-16 border-dashed">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <Package2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>No hay productos disponibles</CardTitle>
                <CardDescription>
                  Aún no se han asignado productos a este convenio.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Resumen y Sugerencias */}
        <div id="order-summary-container" className="lg:col-span-1 lg:sticky lg:top-24 space-y-6 pb-24 lg:pb-0">
          <Suspense fallback={<div>Cargando resumen...</div>}>
            <OrderSummary
              agreementId={agreement.id}
              clientId={client.id}
              clientName={client.contact_name ?? "Cliente"}
              pricesIncludeVat={agreement.price_lists?.prices_include_vat ?? true}
              promotions={promotions}
              vatPercentage={vatPercentage}
            />
          </Suspense>
        </div>
      </main>
      <MobileCartIndicator />
    </div>
  );
}
