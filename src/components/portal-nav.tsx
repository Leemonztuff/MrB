'use client';

import Link from 'next/link';
import { ArrowLeft, User, Package, ShoppingCart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortalNavProps {
    agreementId?: string;
}

export function PortalNav({ agreementId }: PortalNavProps) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white shadow-lg rounded-full px-2 py-2 border">
            <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link href="/portal">
                    <Home className="h-4 w-4 mr-1" />
                    Inicio
                </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link href="/portal/profile">
                    <User className="h-4 w-4 mr-1" />
                    Perfil
                </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link href="/portal/orders">
                    <Package className="h-4 w-4 mr-1" />
                    Pedidos
                </Link>
            </Button>
            {agreementId && (
                <Button variant="ghost" size="sm" asChild className="rounded-full">
                    <Link href={`/pedido/${agreementId}`}>
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Catálogo
                    </Link>
                </Button>
            )}
        </div>
    );
}
