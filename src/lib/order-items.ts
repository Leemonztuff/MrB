import type { CartItem } from '@/types';
import type { BonusInfo } from '@/lib/logic/cart-calculations';

export type OrderItemInput = {
  product_id: string;
  quantity: number;
  price_per_unit: number;
  is_bonus?: boolean;
};

export function hasInvalidPaidPrice(items: OrderItemInput[]): boolean {
  return items.some(
    (item) => !item.is_bonus && (!Number.isFinite(item.price_per_unit) || item.price_per_unit <= 0)
  );
}

export function buildOrderItems(
  items: CartItem[],
  bonusInfo: BonusInfo,
  isVolumePricingActive: boolean
): OrderItemInput[] {
  return items.flatMap(({ product, quantity }) => {
    const unitPrice = isVolumePricingActive
      && product.volume_price != null
      && product.volume_price > 0
      && product.volume_price < product.price
      ? product.volume_price
      : product.price;
    const orderItems: OrderItemInput[] = [{
      product_id: product.id,
      quantity,
      price_per_unit: unitPrice,
    }];
    const bonusQuantity = bonusInfo[product.id]?.bonusQuantity ?? 0;

    if (bonusQuantity > 0) {
      orderItems.push({
        product_id: product.id,
        quantity: bonusQuantity,
        price_per_unit: 0,
        is_bonus: true,
      });
    }

    return orderItems;
  });
}
