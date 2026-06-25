
"use client";

import { useCartStore } from "@/hooks/use-cart-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import Image from "next/image";
import { getImageUrl } from "@/lib/placeholder-images";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onOpenChange, onCheckout }: CartDrawerProps) {
  const { items, totalItems, totalPrice, addItem, removeItem, getItemQuantity } = useCartStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <SheetTitle className="flex items-center gap-2 font-black italic tracking-tighter">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Mi Pedido
            {totalItems > 0 && (
              <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {totalItems} un.
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Tu carrito esta vacio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={getImageUrl("product_card", { seed: item.product.id }, item.product.image_url)}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeItem(item.product.id)}
                    >
                      {getItemQuantity(item.product.id) === 1 ? (
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Minus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <span className="w-8 text-center font-bold tabular-nums">{getItemQuantity(item.product.id)}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => addItem(item.product, 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/5 px-6 py-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-headline font-black text-xl text-primary">{formatCurrency(totalPrice)}</span>
            </div>
            <Button
              onClick={() => {
                onOpenChange(false);
                onCheckout();
              }}
              className="w-full h-12 gap-2 font-black uppercase tracking-widest rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ver Resumen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
