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
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/portal" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">MB</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900">Mr. Blonde</h1>
                                    <p className="text-xs text-gray-500">Portal de Cliente</p>
                                </div>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">{client.contact_name}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-500">{formatCuit(client.cuit)}</span>
                            </div>
                            <form action={logoutPortal}>
                                <Button variant="ghost" size="sm" type="submit" className="text-gray-500 hover:text-red-500">
                                    <LogOut className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Salir</span>
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
                <nav className="border-t">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex gap-1 overflow-x-auto">
                            {navItems.map((item) => (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className="flex items-center gap-2 py-3 px-3 text-sm font-medium text-gray-500 hover:text-primary hover:bg-primary/5 rounded-md transition-colors whitespace-nowrap"
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
