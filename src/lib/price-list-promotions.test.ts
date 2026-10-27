import { describe, expect, it } from 'vitest';
import type { CartItem, ProductWithPrice, Promotion } from '@/types';
import { calculateCartTotals } from '@/lib/logic/cart-calculations';
import { scopePromotionsToPriceListProducts } from '@/lib/price-list-promotions';

function product(id: string): ProductWithPrice {
  return {
    id,
    name: `Producto ${id}`,
    description: null,
    category: 'Cuidado',
    image_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    price: 100,
  };
}

function buyGetPromotion(id: string, buy: number, get: number): Promotion {
  return {
    id,
    name: id,
    description: null,
    rules: { type: 'buy_x_get_y_free' as const, buy, get },
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('scopePromotionsToPriceListProducts', () => {
  it('aplica en cada producto solo la promoción asignada en esa lista', () => {
    const promotions = [
      buyGetPromotion('promo-150-15', 150, 15),
      buyGetPromotion('promo-50-5', 50, 5),
    ];
    const scopedPromotions = scopePromotionsToPriceListProducts(promotions, [
      { product_id: 'product-a', promotion_id: 'promo-150-15' },
      { product_id: 'product-b', promotion_id: 'promo-50-5' },
    ]);

    const totalsA = calculateCartTotals(
      [{ product: product('product-a'), quantity: 150 }] satisfies CartItem[],
      false,
      scopedPromotions,
      21
    );
    const totalsB = calculateCartTotals(
      [{ product: product('product-b'), quantity: 50 }] satisfies CartItem[],
      false,
      scopedPromotions,
      21
    );

    expect(totalsA.bonusInfo['product-a'].bonusQuantity).toBe(15);
    expect(totalsA.bonusInfo['product-b']).toBeUndefined();
    expect(totalsB.bonusInfo['product-b'].bonusQuantity).toBe(5);
    expect(totalsB.bonusInfo['product-a']).toBeUndefined();
  });

  it('no aplica una promoción compra X y lleva Y hasta asignarla a productos', () => {
    const promotions = scopePromotionsToPriceListProducts([
      buyGetPromotion('promo-150-15', 150, 15),
    ], []);

    const totals = calculateCartTotals(
      [{ product: product('product-a'), quantity: 150 }],
      false,
      promotions,
      21
    );

    expect(promotions).toHaveLength(0);
    expect(totals.bonusInfo).toEqual({});
  });
});
