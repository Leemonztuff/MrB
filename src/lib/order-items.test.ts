import { describe, expect, it } from 'vitest';
import type { CartItem, ProductWithPrice, Promotion } from '@/types';
import { calculateCartTotals } from '@/lib/logic/cart-calculations';
import { aggregateOrderItems } from '@/lib/curated-order';
import { buildOrderItems, hasInvalidPaidPrice } from '@/lib/order-items';

const product: ProductWithPrice = {
  id: 'product-1',
  name: 'Producto',
  description: null,
  category: 'Cuidado',
  image_url: null,
  created_at: '2026-01-01T00:00:00.000Z',
  price: 100,
};

function promotion(id: string, buy: number, get: number): Promotion {
  return {
    id,
    name: `Promo ${id}`,
    description: null,
    rules: { type: 'buy_x_get_y_free', buy, get },
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('buildOrderItems', () => {
  it('guarda bonificaciones calculadas para que la orden imprima el total a empacar', () => {
    const items: CartItem[] = [{ product, quantity: 150 }];
    const promotions = [promotion('promo-1', 10, 1)];
    const totals = calculateCartTotals(items, false, promotions, 21);
    const orderItems = buildOrderItems(items, totals.bonusInfo, totals.isVolumePricingActive);
    const printableLines = aggregateOrderItems(orderItems.map(item => ({
      quantity: item.quantity,
      products: { id: product.id, name: product.name },
    })));

    expect(totals.bonusInfo[product.id].bonusQuantity).toBe(15);
    expect(orderItems).toEqual([
      { product_id: product.id, quantity: 150, price_per_unit: 100 },
      { product_id: product.id, quantity: 15, price_per_unit: 0, is_bonus: true },
    ]);
    expect(printableLines).toEqual([
      { id: product.id, name: product.name, quantity: 165 },
    ]);
  });

  it('detecta líneas pagas sin precio válido pero permite bonificaciones en cero', () => {
    expect(hasInvalidPaidPrice([
      { product_id: product.id, quantity: 1, price_per_unit: 100 },
      { product_id: product.id, quantity: 1, price_per_unit: 0, is_bonus: true },
    ])).toBe(false);

    expect(hasInvalidPaidPrice([
      { product_id: product.id, quantity: 1, price_per_unit: 0 },
    ])).toBe(true);

    expect(hasInvalidPaidPrice([
      { product_id: product.id, quantity: 1, price_per_unit: Number.NaN },
    ])).toBe(true);
  });

  it('acumula bonificaciones de varias promociones para el mismo producto', () => {
    const items: CartItem[] = [{ product, quantity: 20 }];
    const promotions = [
      promotion('promo-1', 10, 1),
      promotion('promo-2', 5, 1),
    ];
    const totals = calculateCartTotals(items, false, promotions, 21);
    const orderItems = buildOrderItems(items, totals.bonusInfo, totals.isVolumePricingActive);

    expect(totals.bonusInfo[product.id].bonusQuantity).toBe(6);
    expect(orderItems).toEqual([
      { product_id: product.id, quantity: 20, price_per_unit: 100 },
      { product_id: product.id, quantity: 6, price_per_unit: 0, is_bonus: true },
    ]);
  });
});
