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

    const isActive = client.status?.toLowerCase() === 'active';
    const canOrder = isActive && client.agreement_id;

    if (canOrder) {
        navItems.push({ 
            href: `/pedido/${client.agreement_id}`, 
            label: 'Catálogo', 
            icon: ShoppingCart 
        });
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="glass border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/portal" className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-primary-foreground font-bold text-lg">MB</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">Mr. Blonde</h1>
                                    <p className="text-xs text-muted-foreground">Portal de Cliente</p>
                                </div>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 text-sm">
                                <span className="font-medium">{client.contact_name}</span>
                                <span className="text-muted-foreground">|</span>
                                <span className="text-muted-foreground">{formatCuit(client.cuit)}</span>
                            </div>
                            <Link href="/api/portal/logout" className="text-muted-foreground hover:text-destructive">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                                    <LogOut className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Salir</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                <nav className="border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex gap-1 overflow-x-auto py-1">
                            {navItems.map((item) => (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </nav>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
