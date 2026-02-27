'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCuit, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, MapPin, FileText, Calendar, ShoppingCart, ArrowRight, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

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

export default function PortalPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/client')
      .then(res => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(data => {
        setClient(data);
        setLoading(false);
      })
      .catch(() => {
        router.push('/portal-cliente/login');
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

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
      <div className="flex items-center justify-end">
        <ThemeToggle />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bienvenido, {client.contact_name}</h2>
          <p className="text-muted-foreground">Gestiona tu información y pedidos desde aquí</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            {client.status === 'active' ? '✓ Activo' : client.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {infoCards.map((card) => (
          <Card key={card.label} className="glass hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <card.icon className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold truncate" title={card.value}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass hover:border-primary/30 transition-colors">
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
              <p className="text-sm text-muted-foreground">
                Contactá al administrador para que te asigne un convenio.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass hover:border-primary/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Accesos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/profile">
                <UserIcon className="h-4 w-4 mr-2" />
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

      {client.status?.toLowerCase() !== 'active' && (
        <Card className="border-yellow-600/50 bg-yellow-900/20">
          <CardContent className="py-4">
            <p className="text-yellow-500 text-center">
              Tu cuenta está pendiente de activación. Contactá al administrador para más información.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
