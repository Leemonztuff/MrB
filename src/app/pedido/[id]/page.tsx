
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
import { Button } from "@/components/ui/button";
import { AgreementPromotion, ProductWithPrice } from "@/types";
import { ThemeToggle } from "@/components/theme-toggle";

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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await getOrderPageData(id);

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Error al cargar el portal</h1>
        <p className="mb-8 text-muted-foreground">
          {error?.message || "No se pudo encontrar la información necesaria para este pedido."}
        </p>
        <Button asChild>
          <a href="/">Volver al inicio</a>
        </Button>
      </div>
    );
  }

  const { agreement, client, productsByCategory, vatPercentage, logoUrl } = data;
  const categories = Object.keys(productsByCategory);
  const promotions = (agreement.agreement_promotions || []).map((ap: AgreementPromotion) => ap.promotions);

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
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-40 glass border-b border-white/5 dark:border-white/5 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Logo showText={true} logoUrl={logoUrl} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-right">
            <p className="text-sm font-black italic tracking-tighter text-foreground">{client?.contact_name ?? "Cliente"}</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-primary/70">{agreement.agreement_name}</p>
          </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start p-4 lg:p-12">
        {/* Columna Izquierda: Productos */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter text-foreground">Selección de Productos</h2>
            <p className="mt-2 text-xs uppercase font-bold tracking-widest text-muted-foreground/60 italic">Personaliza tu pedido con nuestra selección exclusiva.</p>
          </div>

          {categories.length > 0 ? (
            <Accordion type="multiple" defaultValue={categories} className="w-full space-y-6">
              {categories.map((category) => (
                <AccordionItem key={category} value={category} className="border-none">
                  <Card className="glass border-white/5 overflow-hidden shadow-2xl">
                    <CardHeader className="p-0">
                      <AccordionTrigger className="px-6 py-5 text-lg font-black italic tracking-tighter hover:no-underline hover:bg-white/5 transition-colors uppercase">
                        {formatCategoryTitle(category)}
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className="px-6 pb-6 pt-2">
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
            <Card className="mt-6 flex flex-col items-center justify-center py-24 glass border-white/5 border-dashed">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-6 border border-white/10 shadow-xl">
                  <Package2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Catálogo Vacío</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  Aún no se han asignado productos a este portal.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Resumen */}
        <div id="order-summary-container" className="lg:col-span-1 lg:sticky lg:top-28 space-y-6 pb-24 lg:pb-0">
          <Suspense fallback={
            <div className="glass p-8 rounded-2xl border-white/10 animate-pulse text-center italic font-bold">
              Cargando resumen maestro...
            </div>
          }>
            <OrderSummary
              agreementId={agreement.id}
              clientId={client?.id ?? "generic"}
              clientName={client?.contact_name ?? "Cliente"}
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
