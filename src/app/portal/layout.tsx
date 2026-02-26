import Link from 'next/link';
import { getPortalClient, logoutPortal } from '@/app/actions/portal.actions';
import { Button } from '@/components/ui/button';
import { formatCuit } from '@/lib/formatters';
import { redirect } from 'next/navigation';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const client = await getPortalClient();

    if (!client) {
        redirect('/portal-cliente/login');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900">Mr. Blonde</h1>
                        <span className="text-sm text-gray-500">Portal de Cliente</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            {client.contact_name}
                        </span>
                        <span className="text-xs text-gray-400">
                            {formatCuit(client.cuit)}
                        </span>
                        <form action={logoutPortal}>
                            <Button variant="outline" size="sm" type="submit">
                                Salir
                            </Button>
                        </form>
                    </div>
                </div>
                <nav className="bg-gray-50 border-t">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex gap-6">
                            <Link 
                                href="/portal" 
                                className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            >
                                Inicio
                            </Link>
                            <Link 
                                href="/portal/profile" 
                                className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            >
                                Mi Perfil
                            </Link>
                            <Link 
                                href="/portal/orders" 
                                className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            >
                                Mis Pedidos
                            </Link>
                            {client.agreement_id && (
                                <Link 
                                    href={`/pedido/${client.agreement_id}`}
                                    className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                >
                                    Nuevo Pedido
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
