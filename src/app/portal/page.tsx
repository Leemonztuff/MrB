import { getPortalClient } from '@/app/actions/portal.actions';
import { formatCuit, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, MapPin, FileText, Calendar, ShoppingCart, ArrowRight } from 'lucide-react';

export default async function PortalPage() {
    const client = await getPortalClient();

    if (!client) {
        return null;
    }

    const infoCards = [
        { label: 'CUIT', value: formatCuit(client.cuit), icon: FileText },
        { label: 'Email', value: client.email || 'No registrado', icon: Mail },
        { label: 'Dirección', value: client.address || 'No registrada', icon: MapPin },
        { label: 'Cliente desde', value: client.created_at ? formatDate(client.created_at) : '-', icon: Calendar },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bienvenido, {client.contact_name}</h2>
                    <p className="text-gray-500">Gestiona tu información y pedidos desde aquí</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                        {client.status === 'active' ? '✓ Activo' : client.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {infoCards.map((card) => (
                    <Card key={card.label} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 flex flex-row items-center gap-2">
                            <card.icon className="h-4 w-4 text-gray-400" />
                            <CardTitle className="text-sm font-medium text-gray-500">{card.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold truncate" title={card.value}>{card.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Mi Convenio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold mb-4">
                            {client.agreements?.agreement_name || 'Sin convenio'}
                        </p>
                        {client.agreement_id ? (
                            <Button asChild className="w-full">
                                <Link href={`/pedido/${client.agreement_id}`}>
                                    Ver Catálogo de Productos
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Contactá al administrador para que te asigne un convenio.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Accesos Rápidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/portal/profile">
                                <Mail className="h-4 w-4 mr-2" />
                                Editar Mi Perfil
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/portal/orders">
                                <FileText className="h-4 w-4 mr-2" />
                                Ver Historial de Pedidos
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {client.status !== 'active' && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="py-4">
                        <p className="text-yellow-800 text-center">
                            Tu cuenta está pendiente de activación. Contactá al administrador para más información.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
