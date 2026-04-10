/**
 * Pricing Rules & Precedence Documentation
 * ==========================================
 * 
 * This document describes the order of operations for price calculations
 * and how promotions, sales conditions, and volume pricing interact.
 * 
 * ORDER OF OPERATIONS (Priority: High to Low)
 * =============================================
 * 
 * 1. BASE PRICE SELECTION
 *    - Check if volume pricing is active (totalItems >= 150 units)
 *    - If active, use volume_price if available and lower than regular price
 *    - Otherwise use regular price
 * 
 * 2. SUBTOTAL CALCULATION
 *    - Apply VAT removal if pricesIncludeVat is true
 *    - Sum (basePrice / (1 + vatRate)) * quantity for each item
 * 
 * 3. PROMOTIONS APPLICATION (Applied to subtotal)
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │ Order:                                                    │
 *    │  a) Buy X Get Y Free (bonuses) - Does NOT affect price    │
 *    │  b) Min Amount Discount - Reduces subtotal               │
 *    │  c) Free Shipping - Informational only (no price impact)  │
 *    └─────────────────────────────────────────────────────────────┘
 * 
 *    a) Buy X Get Y Free:
 *       - For each item, calculate: floor(quantity / buy) * get = bonus
 *       - Bonus items are tracked in bonusInfo (NOT added to totalItems)
 *       - Product-specific promotions override agreement-level ones
 * 
 *    b) Min Amount Discount:
 *       - If subtotal >= min_amount, apply percentage discount
 *       - Multiple promotions: only highest percentage applies
 *       - Applied to subtotal BEFORE sales conditions
 * 
 *    c) Free Shipping:
 *       - Informational only (displayed to user)
 *       - No impact on pricing
 *       - Requires totalItems >= min_units
 * 
 * 4. SALES CONDITIONS APPLICATION
 *    - Applied AFTER promotion discounts
 *    - Types: discount, min_order_amount, net_days, cash_on_delivery, installments, split_payment
 * 
 *    IMPORTANT: Only ONE discount can apply at a time
 *    - If both Promotion (min_amount_discount) AND SalesCondition (discount) exist,
 *      only the larger discount is applied
 * 
 * 5. VAT CALCULATION
 *    - Applied to: subtotalWithPromos - discountFromConditions
 *    - Formula: subtotalWithDiscount * vatRate
 * 
 * 6. FINAL PRICE
 *    - Total = subtotalWithDiscount + vatAmount
 * 
 * 
 * DISCOUNT PRIORITY LOGIC
 * =======================
 * 
 * Rule: The larger discount always wins
 * 
 * Scenario 1: Promotion (10% off $100k) + SalesCondition (5% off)
 *    → Applied: 10% = $10,000 discount
 *    → Reason: Promotion discount is higher
 * 
 * Scenario 2: SalesCondition (15% off) + Promotion (5% off $50k)
 *    → Applied: 15% = $15,000 discount  
 *    → Reason: SalesCondition discount is higher (applied to full subtotal)
 * 
 * 
 * BONUS ITEMS (Buy X Get Y)
 * =========================
 * 
 * - Bonus items are NOT counted toward volume threshold (150 units)
 * - Bonus quantity comes from promotion rules, not product price
 * - Product-specific promotions take precedence over agreement promotions
 * 
 * Example:
 *   - Promotion: Buy 8 Get 2
 *   - Customer buys: 16 units
 *   - Result: 16 paid + 4 bonus = 20 units delivered
 *   - Volume threshold check: uses 16 (paid items only), not 20
 * 
 * 
 * VOLUME PRICING
 * ==============
 * 
 * Threshold: VOLUME_THRESHOLD = 150 units
 * 
 * Activation:
 *   - Only checks totalItems (quantity sum, NOT including bonuses)
 *   - Each product needs its own volume_price set in price_list_items
 * 
 * Priority:
 *   - Volume pricing is checked BEFORE any promotions
 *   - This ensures base price is already reduced before discounts apply
 * 
 * 
 * PRODUCT-SPECIFIC PROMOTIONS
 * ============================
 * 
 * Priority Chain:
 *   1. Product-specific promotion (price_list_product_promotions)
 *   2. Agreement-level promotion (agreement_promotions)
 *   3. No promotion
 * 
 * Logic:
 *   - If a product has a specific promotion, agreement-level promotions
 *     are SKIPPED for that product only
 * 
 * 
 * FUTURE CONSIDERATIONS
 * =====================
 * 
 * - installments: Should calculate total with interest? Currently informational
 * - split_payment: Needs webhook for second payment
 * - free_shipping locations: Currently not implemented in calculator
 * - promotion stacking: Only highest % discount applies (desired behavior)
 * 
 */

export const PRICING_PRECEDENCE = {
  VOLUME_THRESHOLD: 150,
  
  /**
   * Returns human-readable explanation of discount selection
   */
  explainDiscountSelection: (promotionDiscount: number, salesConditionDiscount: number): string => {
    if (promotionDiscount >= salesConditionDiscount) {
      return `Promoción aplicada: ${promotionDiscount}% de descuento`;
    }
    return `Condición de venta aplicada: ${salesConditionDiscount}% de descuento`;
  },
  
  /**
   * Check if free shipping is valid based on total units
   */
  isFreeShippingActive: (totalUnits: number, minUnits: number): boolean => {
    return totalUnits >= minUnits;
  }
} as const;