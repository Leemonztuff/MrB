
"use client";

import { useCartStore } from "@/hooks/use-cart-store";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function MobileCartIndicator() {
    const { totalItems, totalPrice } = useCartStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Solo mostrar si hay items en el carrito
        setIsVisible(totalItems > 0);
    }, [totalItems]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

    const scrollToSummary = () => {
        const summaryElement = document.getElementById('order-summary-container');
        if (summaryElement) {
            summaryElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
            <Button
                onClick={scrollToSummary}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 flex items-center justify-between px-6 rounded-2xl group"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <ShoppingCart className="h-6 w-6" />
                        <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                            {totalItems}
                        </span>
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Mi Pedido</span>
                        <span className="text-sm font-bold tracking-tight">{formatCurrency(totalPrice)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-sm">
                    Ver Resumen
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </Button>
        </div>
    );
}
