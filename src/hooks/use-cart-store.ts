
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProductWithPrice, Promotion, CartItem as CartItemType } from "@/types";
import {
  calculateCartTotals,
  BonusInfo,
  DEFAULT_VOLUME_THRESHOLD
} from "@/lib/logic/cart-calculations";

type CartState = {
  items: CartItemType[];
  totalItems: number;
  subtotal: number;
  subtotalWithDiscount: number;
  discountApplied: number;
  vatAmount: number;
  totalPrice: number;
  isVolumePricingActive: boolean;
  promotions: Promotion[];
  appliedPromotions: Promotion[];
  bonusInfo: BonusInfo;
  clientId: string | null;
  pricesIncludeVat: boolean;
  vatPercentage: number;
  volumeThreshold: number;
  setAgreement: (clientId: string, pricesIncludeVat: boolean, promotions: Promotion[], vatPercentage: number) => void;
  setVolumeThreshold: (threshold: number) => void;
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
      vatAmount: 0,
      totalPrice: 0,
      isVolumePricingActive: false,
      promotions: [],
      appliedPromotions: [],
      bonusInfo: {},
      clientId: null,
      pricesIncludeVat: true,
      vatPercentage: 21,
      volumeThreshold: DEFAULT_VOLUME_THRESHOLD,

      setAgreement: (id: string, pricesIncludeVat: boolean, promotions: Promotion[], vatPercentage: number) => {
        const currentClientId = get().clientId;
        if (id !== currentClientId) {
          set({
            clientId: id,
            pricesIncludeVat: pricesIncludeVat,
            promotions: promotions,
            vatPercentage: vatPercentage,
            items: [],
            totalItems: 0,
            subtotal: 0,
            subtotalWithDiscount: 0,
            discountApplied: 0,
            vatAmount: 0,
            totalPrice: 0,
            isVolumePricingActive: false,
            appliedPromotions: [],
            bonusInfo: {},
          });
        } else {
          const { items, volumeThreshold } = get();
          set({
            pricesIncludeVat: pricesIncludeVat,
            promotions: promotions,
            vatPercentage: vatPercentage,
            ...calculateCartTotals(items, pricesIncludeVat, promotions, vatPercentage, volumeThreshold)
          });
        }
      },

      setVolumeThreshold: (threshold: number) => {
        const { items, pricesIncludeVat, promotions, vatPercentage } = get();
        set({
          volumeThreshold: threshold,
          ...calculateCartTotals(items, pricesIncludeVat, promotions, vatPercentage, threshold)
        });
      },

      addItem: (product: ProductWithPrice, quantity: number = 1) => {
        if (quantity < 1) return;
        const { items, pricesIncludeVat, promotions, vatPercentage, volumeThreshold } = get();
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
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, pricesIncludeVat, promotions, vatPercentage, volumeThreshold) });
      },

      removeItem: (productId: string) => {
        const { items, pricesIncludeVat, promotions, vatPercentage, volumeThreshold } = get();
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

        set({ items: updatedItems, ...calculateCartTotals(updatedItems, pricesIncludeVat, promotions, vatPercentage, volumeThreshold) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { pricesIncludeVat, promotions, vatPercentage, volumeThreshold } = get();
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
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, pricesIncludeVat, promotions, vatPercentage, volumeThreshold) });
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
      },

      clearCart: () => {
        set({ 
          items: [], totalItems: 0, subtotal: 0, subtotalWithDiscount: 0, 
          discountApplied: 0, vatAmount: 0, totalPrice: 0, 
          isVolumePricingActive: false, appliedPromotions: [], bonusInfo: {},
          promotions: [], clientId: null
        });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['appliedPromotions', 'bonusInfo', 'setAgreement', 'setVolumeThreshold', 'addItem', 'removeItem', 'updateQuantity', 'getItemQuantity', 'clearCart'].includes(key))
        ),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          const { totalItems, subtotal, subtotalWithDiscount, discountApplied, vatAmount, totalPrice, isVolumePricingActive, appliedPromotions, bonusInfo } = calculateCartTotals(state.items, state.pricesIncludeVat, state.promotions || [], state.vatPercentage, state.volumeThreshold);
          state.totalItems = totalItems;
          state.subtotal = subtotal;
          state.subtotalWithDiscount = subtotalWithDiscount;
          state.discountApplied = discountApplied;
          state.vatAmount = vatAmount;
          state.totalPrice = totalPrice;
          state.isVolumePricingActive = isVolumePricingActive;
          state.appliedPromotions = appliedPromotions;
          state.bonusInfo = bonusInfo;
        }
      }
    }
  )
);
