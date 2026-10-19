import { describe, it, expect } from "vitest";
import {
  calculateCartTotals,
  calculatePromotions,
  DEFAULT_VOLUME_THRESHOLD,
} from "@/lib/logic/cart-calculations";
import type { CartItem, Promotion, ProductWithPrice } from "@/types";

function makeProduct(overrides: Partial<ProductWithPrice> = {}): ProductWithPrice {
  return {
    id: "p1",
    name: "Producto",
    description: null,
    category: "Ceras",
    image_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
    price: 100,
    volume_price: null,
    ...overrides,
  };
}

function makeItem(overrides: Partial<ProductWithPrice> = {}, quantity = 1): CartItem {
  return { product: makeProduct(overrides), quantity };
}

function makePromotion(rules: Promotion["rules"], overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: "promo1",
    name: "Promo",
    description: null,
    rules,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("calculateCartTotals - IVA", () => {
  it("cuando el precio incluye IVA, lo desagrega del subtotal", () => {
    const totals = calculateCartTotals([makeItem({ price: 121 })], true, [], 21);

    expect(totals.subtotal).toBe(100);
    expect(totals.vatAmount).toBe(21);
    expect(totals.totalPrice).toBe(121);
  });

  it("cuando el precio no incluye IVA, lo suma al total", () => {
    const totals = calculateCartTotals([makeItem({ price: 100 })], false, [], 21);

    expect(totals.subtotal).toBe(100);
    expect(totals.vatAmount).toBe(21);
    expect(totals.totalPrice).toBe(121);
  });

  it("redondea a 2 decimales", () => {
    const totals = calculateCartTotals([makeItem({ price: 100 }, 3)], false, [], 21);

    expect(totals.vatAmount).toBe(63);
    expect(totals.totalPrice).toBe(363);
  });
});

describe("calculateCartTotals - volumen", () => {
  it("usa el umbral por defecto", () => {
    expect(DEFAULT_VOLUME_THRESHOLD).toBe(150);
    const below = calculateCartTotals([makeItem({ volume_price: 90 }, 149)], false, [], 21);
    const at = calculateCartTotals([makeItem({ volume_price: 90 }, 150)], false, [], 21);

    expect(below.isVolumePricingActive).toBe(false);
    expect(at.isVolumePricingActive).toBe(true);
  });

  it("aplica el precio de volumen solo si es menor al precio normal", () => {
    const withDiscount = calculateCartTotals([makeItem({ price: 100, volume_price: 90 }, 150)], false, [], 21);
    const higher = calculateCartTotals([makeItem({ price: 100, volume_price: 120 }, 150)], false, [], 21);

    expect(withDiscount.subtotal).toBe(13500);
    expect(higher.subtotal).toBe(15000);
  });

  it("ignora el precio de volumen en cero o negativo", () => {
    const totals = calculateCartTotals([makeItem({ price: 100, volume_price: 0 }, 150)], false, [], 21);
    expect(totals.subtotal).toBe(15000);
  });
});

describe("calculateCartTotals - promociones", () => {
  it("aplica descuento por monto mínimo y calcula el IVA sobre el subtotal con descuento", () => {
    const promo = makePromotion({ type: "min_amount_discount", min_amount: 50, percentage: 10 });
    const totals = calculateCartTotals([makeItem({ price: 121 })], true, [promo], 21);

    expect(totals.subtotal).toBe(100);
    expect(totals.discountApplied).toBe(10);
    expect(totals.subtotalWithDiscount).toBe(90);
    expect(totals.vatAmount).toBeCloseTo(18.9, 10);
    expect(totals.totalPrice).toBeCloseTo(108.9, 10);
  });

  it("no aplica el descuento si no alcanza el monto mínimo", () => {
    const promo = makePromotion({ type: "min_amount_discount", min_amount: 500, percentage: 10 });
    const totals = calculateCartTotals([makeItem({ price: 121 })], true, [promo], 21);

    expect(totals.discountApplied).toBe(0);
    expect(totals.totalPrice).toBeCloseTo(121, 10);
  });

  it("buy_x_get_y_free suma bonus sin alterar el total", () => {
    const promo = makePromotion({ type: "buy_x_get_y_free", buy: 8, get: 2 });
    const totals = calculateCartTotals([makeItem({ price: 100 }, 8)], false, [promo], 21);

    expect(totals.bonusInfo["p1"]).toEqual({ productName: "Producto", bonusQuantity: 2 });
    expect(totals.subtotal).toBe(800);
    expect(totals.totalPrice).toBe(968);
  });

  it("free_shipping no modifica el total", () => {
    const promo = makePromotion({ type: "free_shipping", min_units: 12 });
    const totals = calculateCartTotals([makeItem({ price: 100 }, 12)], false, [promo], 21);

    expect(totals.appliedPromotions.map(p => p.id)).toContain("promo1");
    expect(totals.totalPrice).toBe(1452);
  });

  it("ignora promociones sin reglas o tipo desconocido", () => {
    const totals = calculateCartTotals(
      [makeItem({ price: 100 })],
      false,
      [makePromotion(null), makePromotion({ type: "otra_cosa" })],
      21
    );

    expect(totals.appliedPromotions).toHaveLength(0);
    expect(totals.totalPrice).toBe(121);
  });

  it("calculatePromotions acota el alcance por producto y categoría", () => {
    const scoped = makePromotion({ type: "buy_x_get_y_free", buy: 2, get: 1, product_ids: ["otro"] });
    const result = calculatePromotions([makeItem({ id: "p1" }, 2)], 200, [scoped]);

    expect(result.appliedPromotions).toHaveLength(0);
    expect(result.bonusInfo).toEqual({});
  });
});

describe("calculateCartTotals - casos borde", () => {
  it("carrito vacío da total 0", () => {
    const totals = calculateCartTotals([], false, [], 21);

    expect(totals.totalItems).toBe(0);
    expect(totals.subtotal).toBe(0);
    expect(totals.totalPrice).toBe(0);
  });
});
