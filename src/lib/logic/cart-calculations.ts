
import { ProductWithPrice, Promotion, CartItem as CartItemType, SalesCondition } from "@/types";

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

export type AppliedSalesCondition = {
    id: string;
    name: string;
    type: string;
    value: number | string;
    description: string;
};

export const calculateSalesConditions = (
    subtotal: number,
    salesConditions: SalesCondition[]
): { appliedConditions: AppliedSalesCondition[]; discountFromConditions: number; minimumOrderValidation?: { valid: boolean; minimum: number; current: number } } => {
    const appliedConditions: AppliedSalesCondition[] = [];
    let discountFromConditions = 0;
    let minimumOrderValidation: { valid: boolean; minimum: number; current: number } | undefined;

    if (!salesConditions || salesConditions.length === 0) {
        return { appliedConditions, discountFromConditions };
    }

    salesConditions.forEach(condition => {
        if (!condition.rules) return;

        const rules = condition.rules;
        
        switch (rules.type) {
            case 'discount':
                if (rules.discount?.percentage) {
                    const discount = subtotal * (rules.discount.percentage / 100);
                    discountFromConditions = Math.max(discountFromConditions, discount);
                    appliedConditions.push({
                        id: condition.id,
                        name: condition.name,
                        type: 'discount',
                        value: rules.discount.percentage,
                        description: `${rules.discount.percentage}% de descuento`
                    });
                }
                break;
            
            case 'min_order_amount':
                if (rules.min_order_amount?.minimum) {
                    const minimum = rules.min_order_amount.minimum;
                    minimumOrderValidation = {
                        valid: subtotal >= minimum,
                        minimum: minimum,
                        current: subtotal
                    };
                    appliedConditions.push({
                        id: condition.id,
                        name: condition.name,
                        type: 'min_order_amount',
                        value: minimum,
                        description: `Monto mínimo: $${minimum}`
                    });
                }
                break;
            
            case 'net_days':
                if (rules.net_days?.days) {
                    appliedConditions.push({
                        id: condition.id,
                        name: condition.name,
                        type: 'net_days',
                        value: rules.net_days.days,
                        description: `Pago a ${rules.net_days.days} días`
                    });
                }
                break;
            
            case 'cash_on_delivery':
                appliedConditions.push({
                    id: condition.id,
                    name: condition.name,
                    type: 'cash_on_delivery',
                    value: 0,
                    description: 'Contra reembolso'
                });
                break;
            
            case 'installments':
                if (rules.installments?.installments) {
                    appliedConditions.push({
                        id: condition.id,
                        name: condition.name,
                        type: 'installments',
                        value: rules.installments.installments,
                        description: `${rules.installments.installments} cuotas`
                    });
                }
                break;
            
            case 'split_payment':
                if (rules.split_payment) {
                    appliedConditions.push({
                        id: condition.id,
                        name: condition.name,
                        type: 'split_payment',
                        value: `${rules.split_payment.initial_percentage}% inicial, saldo en ${rules.split_payment.remaining_days} días`,
                        description: `Pago inicial: ${rules.split_payment.initial_percentage}%, Saldo en ${rules.split_payment.remaining_days} días`
                    });
                }
                break;
        }
    });

    return { appliedConditions, discountFromConditions, minimumOrderValidation };
};

/**
 * Single source of truth for all cart-related calculations (Subtotal, VAT, Discounts, Promos, Sales Conditions).
 */
export const calculateCartTotals = (
    items: CartItemType[],
    pricesIncludeVat: boolean,
    promotions: Promotion[],
    vatPercentage: number,
    salesConditions: SalesCondition[] = []
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
    const subtotalWithPromos = subtotal - discountApplied;
    
    const { appliedConditions, discountFromConditions } = calculateSalesConditions(subtotal, salesConditions);
    
    const subtotalWithDiscount = subtotalWithPromos - discountFromConditions;
    const vatAmount = subtotalWithDiscount * vatRate;
    const totalPrice = subtotalWithDiscount + vatAmount;

    return {
        totalItems,
        subtotal,
        subtotalWithDiscount,
        discountApplied,
        discountFromConditions,
        vatAmount,
        totalPrice,
        isVolumePricingActive,
        appliedPromotions,
        appliedConditions,
        bonusInfo
    };
};
