import { describe, expect, it } from 'vitest';
import { aggregateOrderItems } from './curated-order';

describe('aggregateOrderItems', () => {
  it('sums all quantities for the same product', () => {
    expect(aggregateOrderItems([
      { quantity: 2, products: { id: 'product-1', name: 'Shampoo' } },
      { quantity: 1, products: { id: 'product-1', name: 'Shampoo' } },
    ])).toEqual([
      { id: 'product-1', name: 'Shampoo', quantity: 3 },
    ]);
  });

  it('keeps distinct products and tolerates missing product records', () => {
    expect(aggregateOrderItems([
      { quantity: 4, products: { id: 'product-1', name: 'Shampoo' } },
      { quantity: 2, products: { id: 'product-2', name: 'Acondicionador' } },
      { quantity: 1, products: null },
    ])).toEqual([
      { id: 'product-1', name: 'Shampoo', quantity: 4 },
      { id: 'product-2', name: 'Acondicionador', quantity: 2 },
      { id: 'producto sin nombre', name: 'Producto sin nombre', quantity: 1 },
    ]);
  });

  it('correctly reads product names when relation is returned as an array or object', () => {
    expect(aggregateOrderItems([
      { quantity: 3, products: [{ id: 'product-1', name: 'Cera para cabello' }] },
      { quantity: 2, products: { id: 'product-2', name: 'Aceite de barba' } },
    ])).toEqual([
      { id: 'product-1', name: 'Cera para cabello', quantity: 3 },
      { id: 'product-2', name: 'Aceite de barba', quantity: 2 },
    ]);
  });
});
