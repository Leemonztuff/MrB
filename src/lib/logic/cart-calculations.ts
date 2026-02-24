
import { ProductWithPrice, Promotion, CartItem as CartItemType } from "@/types";

export type BonusInfo = {
    [productId: string]: {
        productName: string;
        bonusQuantity: number;
    }
}

export const VOLUME_THRESHOLD = 150;

/**
 * Calculates applied promotions and bonus items based on current cart items and subtotal.
 */
export const calculatePromotions = (items: CartItemType[], subtotal: number, promotions: Promotion[]) => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const appliedPromotions: Promotion[] = [];
    const bonusInfo: BonusInfo = {};
    let discountPercentage = 0;

    promotions.forEach(promo => {
        if (!promo.rules || !promo.rules.type) return;

        switch (promo.rules.type) {
            case 'buy_x_get_y_free':
                items.forEach(item => {
                    if (item.quantity >= promo.rules.buy) {
                        const times = Math.floor(item.quantity / promo.rules.buy);
                        const bonusQuantity = times * promo.rules.get;
                        if (bonusQuantity > 0) {
                            bonusInfo[item.product.id] = {
                                productName: item.product.name,
                                bonusQuantity: bonusQuantity
                            };
                            if (!appliedPromotions.find(p => p.id === promo.id)) {
                                appliedPromotions.push(promo);
                            }
                        }
                    }
                });
                break;
            case 'free_shipping':
                if (totalItems >= promo.rules.min_units) {
                    if (!appliedPromotions.find(p => p.id === promo.id)) {
                        appliedPromotions.push(promo);
                    }
                }
                break;
            case 'min_amount_discount':
                if (subtotal >= promo.rules.min_amount) {
                    discountPercentage = Math.max(discountPercentage, promo.rules.percentage);
                    if (!appliedPromotions.find(p => p.id === promo.id)) {
                        appliedPromotions.push(promo);
                    }
                }
                break;
            default:
                break;
        }
    });
    return { appliedPromotions, bonusInfo, discountPercentage };
}

/**
 * Single source of truth for all cart-related calculations (Subtotal, VAT, Discounts, Promos).
 */
export const calculateCartTotals = (
    items: CartItemType[],
    pricesIncludeVat: boolean,
    promotions: Promotion[],
    vatPercentage: number
) => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const isVolumePricingActive = totalItems >= VOLUME_THRESHOLD;
    const vatRate = vatPercentage / 100;

    let subtotal = 0;

    items.forEach(item => {
        const basePrice = (isVolumePricingActive && item.product.volume_price != null && item.product.volume_price < item.product.price)
            ? item.product.volume_price
            : item.product.price;

        if (pricesIncludeVat) {
            const singleItemSubtotal = basePrice / (1 + vatRate);
            subtotal += singleItemSubtotal * item.quantity;
        } else {
            const singleItemSubtotal = basePrice;
            subtotal += singleItemSubtotal * item.quantity;
        }
    });

    const { appliedPromotions, bonusInfo, discountPercentage } = calculatePromotions(items, subtotal, promotions);

    const discountApplied = subtotal * (discountPercentage / 100);
    const subtotalWithDiscount = subtotal - discountApplied;
    const vatAmount = subtotalWithDiscount * vatRate;
    const totalPrice = subtotalWithDiscount + vatAmount;

    return {
        totalItems,
        subtotal,
        subtotalWithDiscount,
        discountApplied,
        vatAmount,
        totalPrice,
        isVolumePricingActive,
        appliedPromotions,
        bonusInfo
    };
};
