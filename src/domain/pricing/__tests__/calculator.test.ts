
import { describe, it, expect } from 'vitest';
import { calculatePricing } from '../calculator';

const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    price: 1000,
    volume_price: 800,
    category: 'cabello' as const,
    created_at: '',
    updated_at: '',
    image_url: null,
    description: null
};

describe('Pricing Engine', () => {
    it('calculates simple subtotal without taxes', () => {
        const items = [{ product: mockProduct, quantity: 10 }];
        const result = calculatePricing(items, false, [], 21);

        expect(result.subtotal).toBe(10000);
        expect(result.totalPrice).toBe(12100); // 10000 + 21% VAT
    });

    it('calculates subtotal from VAT-inclusive prices', () => {
        const items = [{ product: mockProduct, quantity: 10 }];
        const result = calculatePricing(items, true, [], 21);

        // 10000 / 1.21 = 8264.46
        expect(result.subtotal).toBeCloseTo(8264.46, 1);
        expect(result.totalPrice).toBeCloseTo(10000, 1);
    });

    it('applies volume pricing over threshold', () => {
        const items = [{ product: mockProduct, quantity: 200 }]; // VOLUME_THRESHOLD = 150
        const result = calculatePricing(items, false, [], 21);

        expect(result.isVolumePricingActive).toBe(true);
        expect(result.subtotal).toBe(200 * 800); // Uses volume_price
    });

    it('applies percentage discount promotion', () => {
        const items = [{ product: mockProduct, quantity: 10 }];
        const promo = {
            id: 'promo-1',
            name: '10% OFF',
            rules: { type: 'min_amount_discount', min_amount: 5000, percentage: 10 }
        } as any;

        const result = calculatePricing(items, false, [promo], 21);

        expect(result.discountApplied).toBe(1000); // 10% of 10000
        expect(result.subtotalWithDiscount).toBe(9000);
    });

    it('applies "Buy X Get Y Free" promotion', () => {
        const items = [{ product: mockProduct, quantity: 5 }];
        const promo = {
            id: 'promo-buy-x',
            name: 'Buy 2 Get 1',
            rules: { type: 'buy_x_get_y_free', buy: 2, get: 1 }
        } as any;

        const result = calculatePricing(items, false, [promo], 21);

        expect(result.bonusInfo['prod-1'].bonusQuantity).toBe(2); // 5 items = 2 bonuses
    });

    it('applies sales condition discount', () => {
        const items = [{ product: mockProduct, quantity: 10 }];
        const condition = {
            id: 'cond-1',
            name: 'Special Condition',
            rules: { type: 'discount', discount: { percentage: 5 } }
        } as any;

        const result = calculatePricing(items, false, [], 21, [condition]);

        expect(result.discountFromConditions).toBe(500); // 5% of 10000
        expect(result.totalPrice).toBeCloseTo(11495, 0); // (10000 - 500) * 1.21 = 11495
    });

    it('validates minimum order amount', () => {
        const items = [{ product: mockProduct, quantity: 1 }]; // $1000
        const condition = {
            id: 'min-order',
            name: 'Min Order',
            rules: { type: 'min_order_amount', min_order_amount: { minimum: 5000 } }
        } as any;

        const result = calculatePricing(items, false, [], 21, [condition]);

        expect(result.minimumOrderValidation?.valid).toBe(false);
        expect(result.minimumOrderValidation?.minimum).toBe(5000);
    });
});
