
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/hooks/use-cart-store";
import type { ProductWithPrice } from "@/types";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  product: ProductWithPrice;
}

export function QuantitySelector({ product }: QuantitySelectorProps) {
  const { addItem, removeItem, getItemQuantity } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const quantity = hasMounted ? getItemQuantity(product.id) : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setInputValue("");
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (inputValue === "") {
      if (quantity > 0) {
        setInputValue(String(quantity));
      }
      return;
    }
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num > 0) {
      addItem(product, num);
    } else if (num === 0) {
      removeItem(product.id);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      addItem(product, 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (quantity > 1) {
        addItem(product, quantity - 1);
      } else {
        removeItem(product.id);
      }
    }
  };

  const handleQuickAdd = (amount: number) => {
    addItem(product, amount);
  };

  const startEditing = () => {
    setIsEditing(true);
    setInputValue(String(quantity));
  };

  if (!hasMounted) {
    return (
      <Button size="sm" className="w-full" disabled>
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
        onClick={() => handleQuickAdd(1)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => removeItem(product.id)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <Input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-16 h-8 text-center font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={isEditing ? inputValue : quantity}
        onChange={handleInputChange}
        onFocus={startEditing}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
      />
      
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => handleQuickAdd(1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
