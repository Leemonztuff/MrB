'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatCuit } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { User, Package, ShoppingCart, LogOut, Newspaper, AlertTriangle } from 'lucide-react';
import { PageLoader } from '@/components/loading';
import { PortalProvider, type PortalClientData, type PortalPendingChange } from '@/contexts/portal-context';
import { logoutPortal } from '@/app/actions/portal.actions';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [client, setClient] = useState<PortalClientData | null>(null);
    const [pendingChanges, setPendingChanges] = useState<PortalPendingChange[]>([]);
    const [loading, setLoading] = useState(true);
    const isPortalLoginRoute = pathname === '/portal/login';

    useEffect(() => {
        if (isPortalLoginRoute) {
            setLoading(false);
            setClient(null);
            setPendingChanges([]);
            return;
        }

        let cancelled = false;

        async function checkAuth() {
            try {
                const response = await fetch('/api/portal/client', {
                    credentials: 'include',
                    cache: 'no-store',
                });

                if (cancelled) return;

                if (response.status === 401) {
                    setClient(null);
                    setPendingChanges([]);
                    router.replace('/portal/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error('No se pudo validar la sesion del portal.');
                }

                const data = await response.json();
                setClient(data.client);
                setPendingChanges(data.pendingChanges || []);
            } catch (error) {
                console.error('Auth check failed:', error);
                if (!cancelled) {
                    setClient(null);
                    setPendingChanges([]);
                    router.replace('/portal/login');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        checkAuth();

        return () => {
            cancelled = true;
        };
    }, [isPortalLoginRoute]);

    if (isPortalLoginRoute) {
        return (
            <PortalProvider isPortalContext={false}>
                {children}
            </PortalProvider>
        );
    }

    if (loading) {
        return <PageLoader />;
    }

    if (!client) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="mb-4">No autenticado</p>
                    <Button asChild>
                        <Link href="/portal/login">Ir al Login</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const navItems = [
        { href: '/portal', label: 'Novedades', icon: Newspaper, exact: true },
        { href: '/portal/profile', label: 'Mi Perfil', icon: User, exact: false },
        { href: '/portal/orders', label: 'Mis Pedidos', icon: Package, exact: false },
    ];

    const isActive = !client.status || client.status?.toLowerCase() === 'active' || client.status?.toLowerCase() === 'activo';
    const canOrder = isActive && client.agreement_id;

    if (canOrder) {
        navItems.push({
            href: '/portal/catalogo',
            label: 'Catálogo',
            icon: ShoppingCart,
            exact: false,
        });
    }

    function isNavActive(href: string, exact: boolean): boolean {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    }

    return (
        <PortalProvider isPortalContext={true} client={client} pendingChanges={pendingChanges}>
        <div className="flex flex-col min-h-screen bg-background relative portal-layout">
            {/* Top Header */}
            <header className="glass border-b border-primary/10 sticky top-0 z-40 backdrop-blur-md flex-none">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
                    <Link href="/portal" className="flex items-center gap-2 sm:gap-3 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground font-black text-sm sm:text-lg italic tracking-tighter">
                            MB
                        </div>
                        <div className="hidden xs:block">
                            <h1 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase leading-none">Mr. Blonde</h1>
                            <p className="text-[8px] sm:text-[9px] text-muted-foreground font-black tracking-widest uppercase opacity-60">Portal de Cliente</p>
                        </div>
                    </Link>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden sm:block lg:hidden flex-col items-end gap-0.5 text-xs mr-2">
                            <span className="font-black italic uppercase tracking-tight text-foreground/80 leading-none">{client.contact_name}</span>
                        </div>
                        
                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl">
                            {navItems.map((item) => {
                                const active = isNavActive(item.href, item.exact);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            active
                                                ? "text-primary bg-primary/10"
                                                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        )}
                                    >
                                        <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        
                        <form action={logoutPortal}>
                            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:6 md:py-8 pb-24 sm:pb-8">
                {!client.cuit && (
                    <div className="mb-4 sm:mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-300">
                                    Ingreso temporal con DNI
                                </p>
                                <p className="text-xs text-amber-100/90">
                                    Tu cuenta no tiene CUIT registrado. Para regularizar el acceso, completa el CUIT en
                                    <Link href="/portal/profile" className="ml-1 font-bold underline underline-offset-2 text-amber-200 hover:text-white">
                                        Mi Perfil
                                    </Link>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-4 sm:bottom-6 left-4 right-4 z-50 glass border border-white/10 rounded-3xl shadow-2xl p-1.5 sm:p-2 flex items-center justify-between gap-1">
                {navItems.map((item) => {
                    const active = isNavActive(item.href, item.exact);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 sm:gap-1 flex-1 py-2 px-1 sm:px-1.5 rounded-2xl transition-all min-w-[56px] sm:min-w-[64px]",
                                active
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-primary hover:bg-white/5"
                            )}
                        >
                            <item.icon className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5" />
                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest truncate w-full text-center leading-none">
                                {item.label}
                            </span>
                            {active && (
                                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
        </PortalProvider>
    );
}
