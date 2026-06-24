
import { ProductWithPrice, Promotion, CartItem as CartItemType } from "@/types";

export type BonusInfo = {
    [productId: string]: {
        productName: string;
        bonusQuantity: number;
    }
}

export const VOLUME_THRESHOLD = 150;

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

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
                    const hasNoScope = !promo.rules.product_ids && !promo.rules.category_names;
                    const appliesToProduct = promo.rules.product_ids?.includes(item.product.id);
                    const appliesToCategory = promo.rules.category_names?.includes(item.product.category);
                    
                    if (!hasNoScope && !appliesToProduct && !appliesToCategory) return;
                    
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
        const basePrice = (
            isVolumePricingActive && 
            item.product.volume_price != null && 
            item.product.volume_price > 0 &&
            item.product.volume_price < item.product.price
        )
            ? item.product.volume_price
            : item.product.price;

        if (pricesIncludeVat) {
            const singleItemSubtotal = roundCurrency(basePrice / (1 + vatRate));
            subtotal += roundCurrency(singleItemSubtotal * item.quantity);
        } else {
            subtotal += roundCurrency(basePrice * item.quantity);
        }
    });

    subtotal = roundCurrency(subtotal);

    const { appliedPromotions, bonusInfo, discountPercentage } = calculatePromotions(items, subtotal, promotions);

    // Only percentage discounts affect the total (buy_x_get_y_free are赠品, not discounts)
    const percentageDiscount = roundCurrency(subtotal * (discountPercentage / 100));
    const totalDiscount = percentageDiscount;
    const subtotalWithDiscount = roundCurrency(subtotal - totalDiscount);
    const vatAmount = roundCurrency(subtotalWithDiscount * vatRate);
    const totalPrice = roundCurrency(subtotalWithDiscount + vatAmount);

    return {
        totalItems,
        subtotal,
        subtotalWithDiscount,
        discountApplied: totalDiscount,
        bonusDiscount: 0,
        percentageDiscount,
        vatAmount,
        totalPrice,
        isVolumePricingActive,
        appliedPromotions,
        bonusInfo
    };
};
