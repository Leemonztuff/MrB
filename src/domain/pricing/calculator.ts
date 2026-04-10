
import { ProductWithPrice, Promotion, CartItem as CartItemType, SalesCondition, PriceListProductPromotion, PromotionApplicationScope } from "@/types";

export type BonusInfo = {
    [productId: string]: {
        productName: string;
        bonusQuantity: number;
        promoId: string;
        promoName: string;
    }
}

export type AppliedSalesCondition = {
    id: string;
    name: string;
    type: string;
    value: number | string;
    description: string;
};

export const VOLUME_THRESHOLD = 150;

/**
 * Check if a promotion applies to a product based on its scope
 */
export const isPromotionApplicableToProduct = (
    promotion: Promotion,
    productId: string,
    productCategory: string | null,
    productPromotions: PriceListProductPromotion[]
): boolean => {
    // 1. First check if product has a specific promotion (highest priority)
    const productSpecificPromo = productPromotions.find(pp => pp.product_id === productId);
    if (productSpecificPromo?.promotions) {
        return productSpecificPromo.promotions.id === promotion.id;
    }

    // 2. If no specific promotion, promotion always applies for agreement-level promotions
    // (The scope filtering is handled at the agreement level when loading promotions)
    return true;
};

/**
 * Get the best applicable promotion for a product from a list
 * considering priority: product-specific > by category > global
 */
export const getBestPromotionForProduct = (
    productId: string,
    productCategory: string | null,
    promotions: Promotion[],
    productPromotions: PriceListProductPromotion[]
): Promotion | null => {
    // 1. Check for product-specific promotion first (highest priority)
    const productSpecificPromo = productPromotions.find(pp => pp.product_id === productId);
    if (productSpecificPromo?.promotions) {
        return productSpecificPromo.promotions;
    }

    // 2. Filter promotions that apply to this product's category
    const applicablePromotions = promotions.filter(promo => {
        // If promotion has no scope defined, it applies to all
        return true; // Scope filtering done at agreement level
    });

    if (applicablePromotions.length === 0) return null;

    // 3. Return the first one (could be enhanced to pick the best one based on rules)
    return applicablePromotions[0];
};

export const getProductSpecificPromotion = (
    productId: string,
    productPromotions: PriceListProductPromotion[]
): Promotion | null => {
    const productPromo = productPromotions.find(pp => pp.product_id === productId);
    return productPromo?.promotions || null;
};

/**
 * Checks if a product has a specific promotion assigned to it.
 */
export const hasProductSpecificPromotion = (
    productId: string,
    productPromotions: PriceListProductPromotion[]
): boolean => {
    return productPromotions.some(pp => pp.product_id === productId);
};

/**
 * Check if a promotion applies to a product based on the promotion's scope
 * and the product's category
 */
export const isPromotionScopeValid = (
    productCategory: string | null,
    scope: PromotionApplicationScope | undefined
): boolean => {
    if (!scope || scope.type === 'all') {
        return true; // Applies to everything
    }

    if (scope.type === 'category') {
        // Check if product category matches the scope
        if (!productCategory) return false;
        return productCategory === scope.category;
    }

    if (scope.type === 'products') {
        // This is handled at product-specific level, not in agreement promotions
        return true;
    }

    return true;
};

/**
 * Filter promotions that apply to a specific product based on scope
 */
export const getApplicablePromotionsForProduct = (
    productId: string,
    productCategory: string | null,
    promotionsWithScope: { promotion: Promotion; scope?: PromotionApplicationScope }[]
): Promotion[] => {
    return promotionsWithScope
        .filter(({ scope }) => isPromotionScopeValid(productCategory, scope))
        .map(({ promotion }) => promotion);
};

/**
 * Domain-specific logic for calculating applied promotions and bonus items.
 * 
 * Priority order:
 * 1. Product-specific promotions (highest priority)
 * 2. Promotions with category scope matching product
 * 3. Promotions with 'all' scope
 */
export const calculatePromotions = (
    items: CartItemType[], 
    subtotal: number, 
    promotions: Promotion[],
    productPromotions: PriceListProductPromotion[] = [],
    // Optional: promotions with scope from agreement
    promotionsWithScope?: { promotion: Promotion; scope?: PromotionApplicationScope }[]
) => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const appliedPromotions: Promotion[] = [];
    const bonusInfo: BonusInfo = {};
    let discountPercentage = 0;

    // Map promotions with scope for filtering
    const promotionsMap = promotionsWithScope 
        ? new Map(promotionsWithScope.map(ps => [ps.promotion.id, ps.scope]))
        : new Map();

    const productsWithSpecificPromo = new Set<string>();
    items.forEach(item => {
        if (hasProductSpecificPromotion(item.product.id, productPromotions)) {
            productsWithSpecificPromo.add(item.product.id);
        }
    });

    promotions.forEach(promo => {
        if (!promo.rules) return;

        const scope = promotionsMap.get(promo.id);

        switch (promo.rules.type) {
            case 'buy_x_get_y_free': {
                const buyRules = promo.rules;
                items.forEach(item => {
                    // Skip if product has specific promotion
                    const productSpecificPromo = getProductSpecificPromotion(item.product.id, productPromotions);
                    if (productSpecificPromo && productSpecificPromo.rules?.type === 'buy_x_get_y_free') {
                        const promoRules = productSpecificPromo.rules;
                        // Handle product-specific promo separately
                        if (item.quantity >= promoRules.buy) {
                            const times = Math.floor(item.quantity / promoRules.buy);
                            const bonusQuantity = times * promoRules.get;
                            if (bonusQuantity > 0) {
                                bonusInfo[item.product.id] = {
                                    productName: item.product.name,
                                    bonusQuantity: bonusQuantity,
                                    promoId: productSpecificPromo.id,
                                    promoName: productSpecificPromo.name
                                };
                                if (!appliedPromotions.find(p => p.id === productSpecificPromo.id)) {
                                    appliedPromotions.push(productSpecificPromo);
                                }
                            }
                        }
                        return; // Skip agreement-level promo for this product
                    }

                    // Check if promotion scope applies to this product
                    const scopeValid = isPromotionScopeValid(item.product.category, scope);
                    if (!scopeValid) return;

                    if (item.quantity >= buyRules.buy) {
                        const times = Math.floor(item.quantity / buyRules.buy);
                        const bonusQuantity = times * buyRules.get;
                        if (bonusQuantity > 0) {
                            bonusInfo[item.product.id] = {
                                productName: item.product.name,
                                bonusQuantity: bonusQuantity,
                                promoId: promo.id,
                                promoName: promo.name
                            };
                            if (!appliedPromotions.find(p => p.id === promo.id)) {
                                appliedPromotions.push(promo);
                            }
                        }
                    }
                });
                break;
            }
            case 'free_shipping': {
                const shippingRules = promo.rules;
                const scopeValid = isPromotionScopeValid(null, scope);
                if (scopeValid && totalItems >= shippingRules.min_units) {
                    if (!appliedPromotions.find(p => p.id === promo.id)) {
                        appliedPromotions.push(promo);
                    }
                }
                break;
            }
            case 'min_amount_discount': {
                const discountRules = promo.rules;
                const scopeValid = isPromotionScopeValid(null, scope);
                if (scopeValid && subtotal >= discountRules.min_amount) {
                    discountPercentage = Math.max(discountPercentage, discountRules.percentage);
                    if (!appliedPromotions.find(p => p.id === promo.id)) {
                        appliedPromotions.push(promo);
                    }
                }
                break;
            }
            default: {
                break;
            }
        }
    });
    return { appliedPromotions, bonusInfo, discountPercentage, productsWithSpecificPromo: Array.from(productsWithSpecificPromo) };
}

/**
 * Domain-specific logic for calculating sales conditions.
 */
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
            case 'discount': {
                const discountRules = rules;
                if (discountRules.discount?.percentage) {
                    const discount = subtotal * (discountRules.discount.percentage / 100);
                    discountFromConditions = Math.max(discountFromConditions, discount);
                    appliedConditions.push({
                        id: condition.id,
                        name: condition.name,
                        type: 'discount',
                        value: discountRules.discount.percentage,
                        description: `${discountRules.discount.percentage}% de descuento`
                    });
                }
                break;
            }

            case 'min_order_amount': {
                const minOrderRules = rules;
                if (minOrderRules.min_order_amount?.minimum) {
                    const minimum = minOrderRules.min_order_amount.minimum;
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
            }

            case 'net_days': {
                const netDaysRules = rules;
                if (netDaysRules.net_days?.days) {
                    appliedConditions.push({
                        id: condition.id,
                        name: condition.name,
                        type: 'net_days',
                        value: netDaysRules.net_days.days,
                        description: `Pago a ${netDaysRules.net_days.days} días`
                    });
                }
                break;
            }

            case 'cash_on_delivery': {
                appliedConditions.push({
                    id: condition.id,
                    name: condition.name,
                    type: 'cash_on_delivery',
                    value: 0,
                    description: 'Contra reembolso'
                });
                break;
            }

            default: {
                break;
            }
        }
    });

    return { appliedConditions, discountFromConditions, minimumOrderValidation };
};

/**
 * Domain Pricing Engine: The single source of truth for all pricing calculations.
 * This is used by the Cart Store (client) and Order Processing (server).
 * 
 * IMPORTANT: Discount Priority Logic
 * ==================================
 * Only ONE discount (percentage-based) can apply at a time.
 * The system compares:
 *   - Promotion discount (from min_amount_discount)
 *   - SalesCondition discount (from discount type)
 * 
 * The larger discount wins and is applied to the subtotal.
 * See src/domain/pricing/rules.ts for full documentation.
 */
export const calculatePricing = (
    items: CartItemType[],
    pricesIncludeVat: boolean,
    promotions: Promotion[],
    vatPercentage: number,
    salesConditions: SalesCondition[] = [],
    productPromotions: PriceListProductPromotion[] = [],
    promotionsWithScope?: { promotion: Promotion; scope?: PromotionApplicationScope }[]
) => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const isVolumePricingActive = totalItems >= VOLUME_THRESHOLD;
    const vatRate = (vatPercentage ?? 21) / 100;

    let subtotal = 0;

    items.forEach(item => {
        const productPrice = item.product.price ?? 0;
        const productVolumePrice = item.product.volume_price ?? null;

        const basePrice = (isVolumePricingActive && productVolumePrice != null && productVolumePrice < productPrice)
            ? productVolumePrice
            : productPrice;

        if (pricesIncludeVat) {
            const singleItemSubtotal = basePrice / (1 + vatRate);
            subtotal += singleItemSubtotal * item.quantity;
        } else {
            const singleItemSubtotal = basePrice;
            subtotal += singleItemSubtotal * item.quantity;
        }
    });

    const { appliedPromotions, bonusInfo, discountPercentage, productsWithSpecificPromo } = calculatePromotions(
        items, 
        subtotal, 
        promotions, 
        productPromotions,
        promotionsWithScope
    );

    // Calculate promotion discount (percentage)
    const promotionDiscountAmount = subtotal * ((discountPercentage ?? 0) / 100);
    const subtotalWithPromos = subtotal - promotionDiscountAmount;

    // Calculate sales conditions discount
    const { appliedConditions, discountFromConditions, minimumOrderValidation } = calculateSalesConditions(subtotal, salesConditions);

    // DISCOUNT PRIORITY LOGIC: Only apply the larger discount
    // Compare promotion discount vs sales condition discount and pick the bigger one
    const totalDiscount = Math.max(promotionDiscountAmount, discountFromConditions ?? 0);
    const discountSource = promotionDiscountAmount >= (discountFromConditions ?? 0) 
        ? 'promotion' 
        : 'salesCondition';

    // Apply the larger discount to the subtotal
    const subtotalWithDiscount = subtotal - totalDiscount;
    
    const vatAmount = subtotalWithDiscount * vatRate;
    const totalPrice = subtotalWithDiscount + vatAmount;

    return {
        totalItems,
        subtotal,
        subtotalWithDiscount,
        discountApplied: totalDiscount,
        discountSource,
        discountFromConditions,
        vatAmount,
        totalPrice,
        isVolumePricingActive,
        appliedPromotions,
        appliedConditions,
        bonusInfo,
        minimumOrderValidation,
        productsWithSpecificPromo
    };
};
