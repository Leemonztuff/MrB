'use server';

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Package2 } from 'lucide-react';
import { getPortalClient } from '@/app/actions/portal.actions';
import { getOrderPageData } from '@/app/actions/user.actions';
import { ProductCard } from '@/app/pedido/[id]/_components/product-card';
import { OrderSummary } from '@/app/pedido/[id]/_components/order-summary';
import { ProductHighlighter } from '@/app/pedido/[id]/_components/product-highlighter';
import { MobileCartIndicator } from '@/app/pedido/[id]/_components/mobile-cart-indicator';
import { Card, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/shared/empty-state';
import type { AgreementPromotion, ProductWithPrice } from '@/types';

export default async function PortalCatalogoPage({
    searchParams,
}: {
    searchParams: Promise<{ newsId?: string; promoId?: string; repeat_order?: string }>;
}) {
    const client = await getPortalClient();

    if (!client?.agreement_id) {
        redirect('/portal');
    }

    const { newsId, promoId, repeat_order } = await searchParams;
    const { data, error } = await getOrderPageData(client.agreement_id, { newsId, promoId, repeatOrderId: repeat_order });

    if (error || !data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">{error?.message || 'Error al cargar el catálogo.'}</p>
            </div>
        );
    }

    if (data.mode !== 'catalog' || !data.agreement) {
        redirect('/portal');
    }

    const {
        agreement,
        client: clientData,
        productsByCategory,
        vatPercentage,
        salesConditions = [],
        showProductDuration = false,
        productDurations = {},
        productPromotions = [],
    } = data;

    const customSortOrder = ['Cabello', 'Rostro', 'Merchandising'];
    const categories = Object.keys(productsByCategory).sort((a, b) => {
        const defaultIndex = 999;
        const indexA = customSortOrder.indexOf(a) !== -1 ? customSortOrder.indexOf(a) : defaultIndex;
        const indexB = customSortOrder.indexOf(b) !== -1 ? customSortOrder.indexOf(b) : defaultIndex;
        return indexA - indexB;
    });

    const promotions = (agreement.agreement_promotions || []).map((ap: AgreementPromotion) => ap.promotions);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-foreground">Catálogo de Productos</h2>
                <p className="mt-1 text-xs uppercase font-bold tracking-widest text-muted-foreground/60 italic">Personaliza tu pedido con nuestra selección exclusiva.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {categories.length > 0 ? (
                        <Accordion type="multiple" defaultValue={categories} className="w-full space-y-4">
                            {categories.map((category) => (
                                <AccordionItem key={category} value={category} className="border-none">
                                    <Card className="glass border-border/50 overflow-hidden shadow-lg">
                                        <CardHeader className="p-0">
                                            <AccordionTrigger className="px-5 py-4 text-sm md:text-base font-black italic tracking-tighter hover:no-underline hover:bg-muted/10 transition-colors uppercase">
                                                {category}
                                            </AccordionTrigger>
                                        </CardHeader>
                                        <AccordionContent className="px-5 pb-5 pt-2">
                                            <div className="flex flex-col gap-3">
                                                {productsByCategory[category].map((product: ProductWithPrice & { consumer_price?: number | null; consumer_volume_price?: number | null }) => (
                                                    <ProductCard
                                                        key={product.id}
                                                        product={product}
                                                        promotions={promotions}
                                                        productPromotions={productPromotions}
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

                <div id="order-summary-container" className="lg:col-span-1 lg:sticky lg:top-24 space-y-4 pb-24 md:pb-4">
                    <Suspense
                        fallback={
                            <div className="glass p-6 rounded-2xl border-border/50 animate-pulse text-center italic font-bold">
                                Cargando resumen...
                            </div>
                        }
                    >
                        <OrderSummary
                            agreementId={agreement.id}
                            clientId={clientData?.id ?? 'generic'}
                            clientName={clientData?.contact_name ?? 'Cliente'}
                            pricesIncludeVat={agreement.price_lists?.prices_include_vat ?? true}
                            promotions={promotions}
                            vatPercentage={vatPercentage}
                            salesConditions={salesConditions}
                            productPromotions={productPromotions}
                        />
                    </Suspense>
                </div>
            </div>
            <MobileCartIndicator />
            <ProductHighlighter />
        </div>
    );
}
