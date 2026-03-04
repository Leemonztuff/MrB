
import { getOrderPageData } from "@/app/actions/user.actions";
import { getPortalClient } from "@/app/actions/portal.actions";
import { ProductCard } from "./_components/product-card";
import { Logo } from "@/app/logo";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Package2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OrderSummary } from "./_components/order-summary";
import { MobileCartIndicator } from "./_components/mobile-cart-indicator";
import { ProductHighlighter } from "./_components/product-highlighter";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AgreementPromotion, ProductWithPrice } from "@/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingInline } from "./_components/onboarding-inline";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ newsId?: string, promoId?: string }>;
}) {
  const { id } = await params;
  const { newsId, promoId } = await searchParams;
  const { data, error } = await getOrderPageData(id, { newsId, promoId });

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold italic tracking-tighter">Acceso Protegido</h1>
        <p className="mb-8 text-muted-foreground text-sm max-w-xs font-medium italic">
          {error?.message || "No se pudo encontrar la sesión solicitada. Verifica tu enlace."}
        </p>
        <Button asChild className="rounded-xl">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  const { mode, agreement, client, productsByCategory, vatPercentage, logoUrl, salesConditions = [], showProfitEstimation = false, showProductDuration = false, productDurations = {} } = data;

  if (mode === 'onboarding') {
    return (
      <OnboardingInline
        token={id}
        clientName={client?.contact_name}
        logoUrl={logoUrl}
      />
    );
  }

  if (!agreement) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <Logo showText logoUrl={logoUrl} className="mb-8" />
        <h1 className="mb-4 text-2xl font-bold italic tracking-tighter text-primary">Convenio Pendiente</h1>
        <p className="mb-8 text-muted-foreground text-sm max-w-sm font-medium italic leading-relaxed">
          Tus datos han sido registrados con éxito, pero aún no tienes un convenio asignado para ver precios.
          Te notificaremos por WhatsApp cuando tu cuenta esté activa.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal/login">Ir al Portal</Link>
        </Button>
      </div>
    );
  }

  const portalSession = await getPortalClient();
  const isFromPortal = portalSession?.agreement_id === agreement.id;
  const customSortOrder = ["Cabello", "Rostro", "Merchandising"];
  const categories = Object.keys(productsByCategory).sort((a, b) => {
    const defaultIndex = 999;
    const indexA = customSortOrder.indexOf(a) !== -1 ? customSortOrder.indexOf(a) : defaultIndex;
    const indexB = customSortOrder.indexOf(b) !== -1 ? customSortOrder.indexOf(b) : defaultIndex;
    return indexA - indexB;
  });
  const promotions = (agreement.agreement_promotions || []).map((ap: AgreementPromotion) => ap.promotions);



  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-40 glass border-b border-border/50 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {isFromPortal && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                title="Volver al Portal"
                className="h-10 w-10 shrink-0 md:h-10 md:w-auto md:px-4 rounded-full md:rounded-xl glass hover:bg-muted/30 transition-all border border-border/50 shadow-lg"
              >
                <Link href="/portal">
                  <ArrowLeft className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline font-black uppercase tracking-widest text-[10px]">Portal</span>
                </Link>
              </Button>
            )}
            <div className={`${isFromPortal ? "hidden md:block" : ""}`}>
              <Logo showText={!isFromPortal} logoUrl={logoUrl} />
            </div>
          </div>
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
                  <Card className="glass border-border/50 overflow-hidden shadow-2xl">
                    <CardHeader className="p-0">
                      <AccordionTrigger className="px-6 py-5 text-lg font-black italic tracking-tighter hover:no-underline hover:bg-muted/10 transition-colors uppercase">
                        {category}
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="flex flex-col gap-4">
                        {productsByCategory[category].map((product: ProductWithPrice & { consumer_price?: number | null; consumer_volume_price?: number | null }) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            promotions={promotions}
                            showProfitEstimation={showProfitEstimation}
                            showProductDuration={showProductDuration}
                            productDurations={productDurations}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <EmptyState
              icon={Package2}
              title="Catálogo vacío"
              description="No se han asignado productos a este portal."
            />
          )}
        </div>

        {/* Columna Derecha: Resumen */}
        <div id="order-summary-container" className="lg:col-span-1 lg:sticky lg:top-28 space-y-6 pb-24 lg:pb-0">
          <Suspense fallback={
            <div className="glass p-8 rounded-2xl border-border/50 animate-pulse text-center italic font-bold">
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
              salesConditions={salesConditions}
            />
          </Suspense>
        </div>
      </main>
      <MobileCartIndicator />
      <ProductHighlighter />
    </div>
  );
}
