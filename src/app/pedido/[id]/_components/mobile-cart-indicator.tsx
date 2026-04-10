'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/hooks/use-cart-store';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight, PackageCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileCartIndicator() {
    const { totalItems, totalPrice, subtotalWithDiscount } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();
    const isPortalCatalog = pathname?.startsWith('/portal/catalogo');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

    const scrollToSummary = () => {
        const summaryElement = document.getElementById('order-summary-container');
        if (summaryElement) {
            summaryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!isMounted || totalItems === 0) return null;

    const hasDiscount = subtotalWithDiscount !== totalPrice;

    return (
        <div className={cn(
            "fixed z-50 lg:hidden animate-in fade-in slide-in-from-bottom-10 duration-300 left-3 right-3 sm:left-4 sm:right-4",
            isPortalCatalog ? "bottom-28 sm:bottom-32" : "bottom-4 sm:bottom-6"
        )}>
            <Button
                onClick={scrollToSummary}
                className="w-full h-16 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-primary/20 flex items-center justify-between px-4 sm:px-6 rounded-2xl group transition-all active:scale-[0.98]"
            >
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative">
                        <div className="p-1.5 sm:p-2 bg-white/20 rounded-xl">
                            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 bg-primary-foreground text-primary text-[9px] sm:text-[10px] font-black h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full flex items-center justify-center shadow-md">
                            {totalItems}
                        </span>
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider opacity-90">Mi Pedido</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-base sm:text-lg font-black tracking-tight">{formatCurrency(totalPrice)}</span>
                            {hasDiscount && (
                                <span className="text-[10px] sm:text-xs font-medium line-through opacity-50">
                                    {formatCurrency(subtotalWithDiscount)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm">
                    <span className="hidden xs:inline">Ver</span>
                    <span className="xs:hidden text-[10px]">Ver</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </Button>
        </div>
    );
}
