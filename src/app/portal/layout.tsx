import Link from 'next/link';
import { getPortalClient, logoutPortal } from '@/app/actions/portal.actions';
import { Button } from '@/components/ui/button';
import { formatCuit } from '@/lib/formatters';
import { redirect } from 'next/navigation';
import { User, Package, ShoppingCart, LogOut } from 'lucide-react';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const client = await getPortalClient();

    if (!client) {
        redirect('/portal-cliente/login');
    }

    const navItems = [
        { href: '/portal', label: 'Inicio', icon: User },
        { href: '/portal/profile', label: 'Mi Perfil', icon: User },
        { href: '/portal/orders', label: 'Mis Pedidos', icon: Package },
    ];

    if (client.agreement_id) {
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
                            <form action={logoutPortal}>
                                <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-destructive">
                                    <LogOut className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Salir</span>
                                </Button>
                            </form>
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
