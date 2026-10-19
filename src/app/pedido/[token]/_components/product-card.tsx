
"use client";

import { useMemo } from "react";
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
import { formatCurrency } from "@/lib/formatters";

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

export function ProductCard({ product, promotions }: { product: ProductWithPrice, promotions: Promotion[] }) {
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

  return (
    <Card className="flex flex-col overflow-hidden glass border-white/5 hover:bg-white/5 transition-all duration-300 group">
      <CardContent className="p-3 flex flex-row items-center gap-3">
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0">
          <Image
            src={getImageUrl("product_card", { seed: product.id }, product.image_url)}
            alt={product.name}
            width={96}
            height={96}
            className="rounded-lg object-cover border border-white/10 group-hover:border-primary/50 transition-colors shadow-lg w-full h-full"
            data-ai-hint="product image"
          />
        </div>

        <div className="flex flex-col justify-between w-full gap-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-lg font-black italic tracking-tighter leading-tight group-hover:text-primary transition-colors truncate">{product.name}</h3>
            {product.category && (
              <Badge variant="outline" className="text-[9px] sm:text-[8px] uppercase font-black tracking-widest py-0 px-1.5 sm:px-2 bg-primary/5 border-primary/20 text-primary shrink-0 hidden sm:inline-flex">
                {product.category}
              </Badge>
            )}
          </div>

          <p className="text-[11px] sm:text-[10px] text-muted-foreground/80 font-medium line-clamp-1 sm:line-clamp-2 leading-relaxed italic">
            {product.description || "Sin descripcion disponible."}
          </p>

          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-baseline gap-1.5">
              <p className={cn(
                "font-headline font-black text-base sm:text-xl",
                isVolumePriceApplicable ? "text-primary" : "text-foreground"
              )}>
                {displayPrice ? formatCurrency(displayPrice) : '$0'}
              </p>
              {isVolumePriceApplicable && (
                <p className="text-[10px] font-bold text-muted-foreground/50 line-through hidden sm:inline">
                  {formatCurrency(product.price)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {applicablePromos.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {applicablePromos.map(promo => (
                    <PromoButton key={promo.id} promo={promo} onClick={(quantity) => addItem(product, quantity)} />
                  ))}
                </div>
              )}
              <div className="w-28 sm:w-32 flex-shrink-0">
                <QuantitySelector product={product} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
