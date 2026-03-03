'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatCuit } from '@/lib/formatters';
import { User, Package, ShoppingCart, LogOut } from 'lucide-react';

interface Client {
    id: string;
    contact_name: string | null;
    email: string | null;
    address: string | null;
    created_at: string;
    status: string;
    agreement_id: string | null;
    agreements?: { agreement_name: string } | null;
    cuit: string | null;
}

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch('/api/portal/client', {
                    credentials: 'include'
                });
                if (!response.ok) {
                    router.push('/portal-cliente/login');
                    return;
                }
                const data = await response.json();
                setClient(data.client);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/portal-cliente/login');
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="mb-4">No autenticado</p>
                    <Button asChild>
                        <Link href="/portal-cliente/login">Ir al Login</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const navItems = [
        { href: '/portal', label: 'Inicio', icon: User },
        { href: '/portal/profile', label: 'Mi Perfil', icon: User },
        { href: '/portal/orders', label: 'Mis Pedidos', icon: Package },
    ];

    const isActive = !client.status || client.status?.toLowerCase() === 'active' || client.status?.toLowerCase() === 'activo';
    const canOrder = isActive && client.agreement_id;

    if (canOrder) {
        navItems.push({
            href: `/pedido/${client.agreement_id}`,
            label: 'Catálogo',
            icon: ShoppingCart
        });
    }

    return (
        <div className="portal-layout">
            <header className="glass border-b border-primary/10 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/portal" className="flex items-center gap-3 group">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                    <span className="text-primary-foreground font-black text-lg italic italic-black">MB</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-black italic tracking-tighter uppercase">Mr. Blonde</h1>
                                    <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-60">Portal de Cliente</p>
                                </div>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex flex-col items-end gap-0.5 text-xs">
                                <span className="font-black italic uppercase tracking-tight text-foreground/80">{client.contact_name}</span>
                                <span className="text-[10px] text-muted-foreground font-bold tracking-widest">{formatCuit(client.cuit)}</span>
                            </div>
                            <Link href="/api/portal/logout" className="text-muted-foreground hover:text-destructive">
                                <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline font-bold uppercase tracking-widest text-[10px]">Salir</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                <nav className="border-t border-white/5 bg-white/5">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex gap-1 overflow-x-auto py-1 scrollbar-hide">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                >
                                    <item.icon className="h-3.5 w-3.5" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </nav>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </main>
        </div>
    );
}
