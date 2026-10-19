
"use client";

import { useState } from "react";
import { CartDrawer } from "./cart-drawer";
import { MobileCartIndicator } from "./mobile-cart-indicator";
import type { Promotion } from "@/types";

export function CartDrawerWrapper({
  clientId,
  clientName,
  pricesIncludeVat,
  promotions,
  vatPercentage,
}: {
  clientId: string;
  clientName: string;
  pricesIncludeVat: boolean;
  promotions: Promotion[];
  vatPercentage: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scrollToSummary = () => {
    const summaryElement = document.getElementById('order-summary-container');
    if (summaryElement) {
      summaryElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <MobileCartIndicator onOpenCart={() => setDrawerOpen(true)} />
      <CartDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCheckout={scrollToSummary}
      />
    </>
  );
}
