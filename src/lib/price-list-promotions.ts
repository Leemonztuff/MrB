import type { Promotion } from '@/types';

export type PriceListPromotionAssignment = {
  product_id: string;
  promotion_id: string;
};

export function scopePromotionsToPriceListProducts(
  promotions: Promotion[],
  assignments: PriceListPromotionAssignment[]
): Promotion[] {
  const productIdsByPromotion = new Map<string, Set<string>>();

  for (const assignment of assignments) {
    const productIds = productIdsByPromotion.get(assignment.promotion_id) ?? new Set<string>();
    productIds.add(assignment.product_id);
    productIdsByPromotion.set(assignment.promotion_id, productIds);
  }

  return promotions.flatMap(promotion => {
    if (promotion.rules?.type !== 'buy_x_get_y_free') return [promotion];

    const productIds = productIdsByPromotion.get(promotion.id);
    if (!productIds?.size) return [];

    return [{
      ...promotion,
      price_list_product_ids: [...productIds],
    }];
  });
}
