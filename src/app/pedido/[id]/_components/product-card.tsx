
"use client";

import { useMemo, memo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductWithPrice, Promotion } from "@/types";
import Image from "next/image";
import { QuantitySelector } from "./add-to-cart-button";
import { getImageUrl } from "@/lib/placeholder-images";
import { useCartStore } from "@/hooks/use-cart-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock } from "lucide-react";

const PromoButton = ({ promo, onClick }: { promo: Promotion, onClick: (quantity: number) => void }) => {
  const buyQuantity = promo.rules.buy;
  const getQuantity = promo.rules.get;
  if (!buyQuantity || !getQuantity) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-auto px-2 py-1 text-xs"
      onClick={() => onClick(buyQuantity)}
    >
      Promo {buyQuantity}x{getQuantity}
    </Button>
  )
}

interface ProductWithConsumerPrice extends ProductWithPrice {
  consumer_price?: number | null;
  consumer_volume_price?: number | null;
}

const ProductCardComponent = ({
  product,
  promotions,
  showProfitEstimation = false,
  showProductDuration = false,
  productDurations = {}
}: {
  product: ProductWithConsumerPrice,
  promotions: Promotion[],
  showProfitEstimation?: boolean,
  showProductDuration?: boolean,
  productDurations?: Record<string, number>
}) => {
  const { isVolumePricingActive, addItem } = useCartStore();

  const applicablePromos = useMemo(() => {
    return promotions.filter(promo => {
      if (promo.rules?.type !== 'buy_x_get_y_free') return false;

      const hasNoScope = !promo.rules.product_ids && !promo.rules.category_names;
      if (hasNoScope) return true;

      const appliesToProduct = promo.rules.product_ids?.includes(product.id);
      const appliesToCategory = product.category && promo.rules.category_names?.includes(product.category);

      return !!(appliesToProduct || appliesToCategory);
    });
  }, [promotions, product.id, product.category]);

  const isVolumePriceApplicable = isVolumePricingActive && product.volume_price && product.volume_price < product.price;
  const displayPrice = isVolumePriceApplicable ? product.volume_price : product.price;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num);
  }

  const consumerPrice = product.consumer_price || null;
  const profitPerUnit = consumerPrice && displayPrice ? consumerPrice - displayPrice : null;
  const profitPercentage = profitPerUnit && displayPrice ? Math.round((profitPerUnit / displayPrice) * 100) : null;

  const productDuration = showProductDuration ? (productDurations[product.id] || null) : null;

  return (
    <Card
      id={`product-${product.id}`}
      className="flex flex-col sm:flex-row w-full overflow-hidden glass border-white/5 hover:bg-white/5 transition-all duration-300 group scroll-mt-24"
    >
      <CardContent className="p-0 flex flex-col sm:flex-row items-center gap-4 p-4 w-full">
        <div className="relative aspect-square w-full sm:w-24 sm:h-24 flex-shrink-0">
          <Image
            src={getImageUrl("product_card", { seed: product.id }, product.image_url)}
            alt={product.name}
            width={96}
            height={96}
            className="rounded-xl object-cover border border-white/10 group-hover:border-primary/50 transition-colors shadow-lg"
            data-ai-hint="product image"
          />
        </div>

        <div className="flex flex-col justify-between w-full gap-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
            <h3 className="text-lg font-black italic tracking-tighter leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
            {product.category && (
              <div className="mt-1 sm:mt-0">
                <Badge variant="outline" className="text-[8px] uppercase font-black tracking-widest py-0 px-2 bg-primary/5 border-primary/20 text-primary">
                  {product.category}
                </Badge>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/80 font-medium line-clamp-2 leading-relaxed italic sm:h-8">
            {product.description || "Sin descripción disponible."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-4">
            <div className="flex items-baseline gap-2 self-start sm:self-center">
              <p className={cn(
                "font-headline font-black text-xl",
                isVolumePriceApplicable ? "text-primary" : "text-foreground"
              )}>
                {displayPrice ? formatCurrency(displayPrice) : '$0'}
              </p>
              {isVolumePriceApplicable && (
                <p className="text-xs font-bold text-muted-foreground/50 line-through">
                  {formatCurrency(product.price)}
                </p>
              )}
              {showProfitEstimation && profitPerUnit && profitPerUnit > 0 && (
                <div className="flex items-center gap-1 text-green-500" title={`Precio consumidor: ${formatCurrency(consumerPrice!)}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-bold">+{formatCurrency(profitPerUnit)} ({profitPercentage}%)</span>
                </div>
              )}
              {showProductDuration && productDuration && (
                <div className="flex items-center gap-1 text-amber-500" title={`Basado en tu historial de compras`}>
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-bold">~{productDuration} días</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end w-full">
              {applicablePromos.length > 0 && (
                <div className="flex items-center gap-1">
                  {applicablePromos.map(promo => (
                    <PromoButton key={promo.id} promo={promo} onClick={(quantity) => addItem(product, quantity)} />
                  ))}
                </div>
              )}
              <div className="w-32 flex-shrink-0">
                <QuantitySelector product={product} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ProductCard = memo(ProductCardComponent);
