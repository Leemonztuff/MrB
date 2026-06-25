
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/hooks/use-cart-store";
import type { ProductWithPrice } from "@/types";
import { Minus, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({ product }: { product: ProductWithPrice }) {
  const { addItem, removeItem, getItemQuantity } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const quantity = hasMounted ? getItemQuantity(product.id) : 0;

  const handleAdd = () => {
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  if (!hasMounted) {
     return (
      <Button
        size="lg"
        className="w-full h-11"
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
        size="lg"
        className={cn(
          "w-full h-11 transition-all duration-200",
          justAdded && "scale-95 bg-green-600 hover:bg-green-600"
        )}
        onClick={handleAdd}
      >
        {justAdded ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Agregado
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={() => removeItem(product.id)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-10 text-center font-bold text-lg tabular-nums">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={handleAdd}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
