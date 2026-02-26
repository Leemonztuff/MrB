import { getPortalClient } from '@/app/actions/portal.actions';
import { formatCuit, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function PortalPage() {
    const client = await getPortalClient();

    if (!client) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Bienvenido, {client.contact_name}</h2>
                <p className="text-gray-500">Gestiona tu información y pedidos</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">CUIT</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{formatCuit(client.cuit)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{client.email || 'No registrado'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Convenio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {client.agreements?.agreement_name || 'Sin convenio'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Dirección</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{client.address || 'No registrada'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status === 'active' ? 'Activo' : client.status}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Cliente desde</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {client.created_at ? formatDate(client.created_at) : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">¿Querés hacer un nuevo pedido?</h3>
                <p className="text-sm text-blue-700 mt-1">
                    Accedé a la sección de pedidos para ver los productos disponibles y realizar tu pedido.
                </p>
            </div>
        </div>
    );
}
