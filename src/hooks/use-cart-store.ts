
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProductWithPrice, Promotion, CartItem as CartItemType, SalesCondition } from "@/types";
import {
  calculateCartTotals,
  BonusInfo,
  AppliedSalesCondition
} from "@/lib/logic/cart-calculations";

type CartState = {
  items: CartItemType[];
  totalItems: number;
  subtotal: number;
  subtotalWithDiscount: number;
  discountApplied: number;
  discountFromConditions: number;
  vatAmount: number;
  totalPrice: number;
  isVolumePricingActive: boolean;
  promotions: Promotion[];
  appliedPromotions: Promotion[];
  salesConditions: SalesCondition[];
  appliedConditions: AppliedSalesCondition[];
  bonusInfo: BonusInfo;
  agreementId: string | null;
  pricesIncludeVat: boolean;
  vatPercentage: number;
  setAgreement: (id: string, pricesIncludeVat: boolean, promotions: Promotion[], vatPercentage: number, salesConditions?: SalesCondition[]) => void;
  addItem: (product: ProductWithPrice, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,
      subtotalWithDiscount: 0,
      discountApplied: 0,
      discountFromConditions: 0,
      vatAmount: 0,
      totalPrice: 0,
      isVolumePricingActive: false,
      promotions: [],
      appliedPromotions: [],
      salesConditions: [],
      appliedConditions: [],
      bonusInfo: {},
      agreementId: null,
      pricesIncludeVat: true,
      vatPercentage: 21,

      setAgreement: (id: string, pricesIncludeVat: boolean, promotions: Promotion[], vatPercentage: number, salesConditions: SalesCondition[] = []) => {
        const currentAgreementId = get().agreementId;
        if (id !== currentAgreementId) {
          set({
            agreementId: id,
            pricesIncludeVat: pricesIncludeVat,
            promotions: promotions,
            vatPercentage: vatPercentage,
            salesConditions: salesConditions,
            items: [],
            totalItems: 0,
            subtotal: 0,
            subtotalWithDiscount: 0,
            discountApplied: 0,
            discountFromConditions: 0,
            vatAmount: 0,
            totalPrice: 0,
            isVolumePricingActive: false,
            appliedPromotions: [],
            appliedConditions: [],
            bonusInfo: {},
          });
        } else {
          const { items } = get();
          set({
            pricesIncludeVat: pricesIncludeVat,
            promotions: promotions,
            vatPercentage: vatPercentage,
            salesConditions: salesConditions,
            ...calculateCartTotals(items, pricesIncludeVat, promotions, vatPercentage, salesConditions)
          });
        }
      },

      addItem: (product: ProductWithPrice, quantity: number = 1) => {
        const { items, pricesIncludeVat, promotions, vatPercentage, salesConditions } = get();
        const existingItem = items.find(
          (item) => item.product.id === product.id
        );

        let updatedItems;
        if (existingItem) {
          updatedItems = items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.max(0, item.quantity + quantity) }
              : item
          );
        } else {
          updatedItems = [...items, { product, quantity }];
        }

        updatedItems = updatedItems.filter(item => item.quantity > 0);
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, pricesIncludeVat, promotions, vatPercentage, salesConditions) });
      },

      removeItem: (productId: string) => {
        const { items, pricesIncludeVat, promotions, vatPercentage, salesConditions } = get();
        const existingItem = items.find(item => item.product.id === productId);

        if (!existingItem) return;

        let updatedItems;
        if (existingItem.quantity > 1) {
          updatedItems = items.map(item =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          updatedItems = items.filter(item => item.product.id !== productId);
        }

        set({ items: updatedItems, ...calculateCartTotals(updatedItems, pricesIncludeVat, promotions, vatPercentage, salesConditions) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { pricesIncludeVat, promotions, vatPercentage, salesConditions } = get();
        let updatedItems;
        if (quantity <= 0) {
          updatedItems = get().items.filter(
            (item) => item.product.id !== productId
          );
        } else {
          updatedItems = get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          );
        }
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, pricesIncludeVat, promotions, vatPercentage, salesConditions) });
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, subtotal: 0, subtotalWithDiscount: 0, discountApplied: 0, discountFromConditions: 0, vatAmount: 0, totalPrice: 0, isVolumePricingActive: false, appliedPromotions: [], appliedConditions: [], bonusInfo: {} });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['promotions', 'appliedPromotions', 'bonusInfo', 'salesConditions', 'appliedConditions'].includes(key))
        ),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          const salesConditions = state.salesConditions || [];
          const { totalItems, subtotal, subtotalWithDiscount, discountApplied, discountFromConditions, vatAmount, totalPrice, isVolumePricingActive, appliedConditions } = calculateCartTotals(state.items, state.pricesIncludeVat, [], state.vatPercentage, salesConditions);
          state.totalItems = totalItems;
          state.subtotal = subtotal;
          state.subtotalWithDiscount = subtotalWithDiscount;
          state.discountApplied = discountApplied;
          state.discountFromConditions = discountFromConditions;
          state.vatAmount = vatAmount;
          state.totalPrice = totalPrice;
          state.isVolumePricingActive = isVolumePricingActive;
          state.promotions = [];
          state.appliedPromotions = [];
          state.appliedConditions = appliedConditions;
          state.bonusInfo = {};
        }
      }
    }
  )
);
