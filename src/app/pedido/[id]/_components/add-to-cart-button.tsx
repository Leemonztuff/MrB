
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/hooks/use-cart-store";
import type { ProductWithPrice } from "@/types";
import { Minus, Plus } from "lucide-react";

export function QuantitySelector({ product }: { product: ProductWithPrice }) {
  const { addItem, removeItem, getItemQuantity } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const quantity = hasMounted ? getItemQuantity(product.id) : 0;

  if (!hasMounted) {
     return (
      <Button
        size="sm"
        className="w-full"
        disabled
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar
      </Button>
    );
  }

  if (quantity === 0) {
    return (
      <Button
        size="sm"
        className="w-full"
        onClick={() => addItem(product, 1)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => removeItem(product.id)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-10 text-center font-bold text-lg">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => addItem(product, 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
