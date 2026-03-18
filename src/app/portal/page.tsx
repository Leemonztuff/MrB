'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCuit, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, MapPin, FileText, Calendar, ShoppingCart, ArrowRight, User as UserIcon, ChevronRight, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { getPublicNews } from '@/app/actions/news.actions';
import { NewsCarousel } from '@/components/shared/news-carousel';
import { NewsPost } from '@/types';

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
  const [news, setNews] = useState<NewsPost[]>([]);
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
        console.log('Client data:', data);
        setClient(data.client);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Auth error:', err);
        router.push('/portal-cliente/login');
      });

    // Fetch news
    getPublicNews().then(res => {
      if (res.data) setNews(res.data);
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

  const isActive = !client.status || client.status?.toLowerCase() === 'active' || client.status?.toLowerCase() === 'activo';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
            Hola, <span className="text-primary">{client.contact_name?.split(' ')[0]}</span>
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
            Gestiona tu información y pedidos desde aquí
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
              isActive ? "bg-primary/20 text-primary border-primary/20" : ""
            )}
          >
            {isActive ? '✓ Cliente Activo' : client.status}
          </Badge>
          <ThemeToggle />
        </div>
      </div>

      {news && news.length > 0 && (
        <div className="animate-in fade-in zoom-in-95 duration-500 delay-150">
          <NewsCarousel news={news} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {infoCards.map((card, idx) => (
          <Card key={card.label} className={cn("glass-card group border-border/50", `animation-delay-${(idx + 1) * 100}`)}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.label}</span>
              <card.icon className="h-4 w-4 text-primary opacity-50 transition-opacity duration-200" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold truncate leading-none text-foreground" title={card.value}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-none bg-primary/5 hover:bg-primary/10 transition-colors duration-200 group">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                <ShoppingCart className="h-5 w-5" />
              </div>
              Mi Convenio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-2xl font-black italic tracking-tight mb-6 text-foreground">
              {client.agreements?.agreement_name || 'Sin convenio'}
            </p>
            {client.agreement_id ? (
              <Button asChild className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl group/btn transition-all">
                <Link href="/portal/catalogo">
                  <span>Ir al Catálogo</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            ) : (
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground font-medium text-center italic">
                  Contactá al administrador para que te asigne un convenio.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
              <div className="p-2 rounded-lg bg-muted/50 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              Accesos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <Button variant="outline" className="w-full h-11 justify-start border-border/50 hover:bg-muted/30 rounded-xl group font-bold text-foreground transition-all" asChild>
              <Link href="/portal/profile">
                <UserIcon className="h-4 w-4 mr-3 text-primary" />
                <span className="text-xs uppercase tracking-widest text-[10px]">Editar Mi Perfil</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full h-11 justify-start border-border/50 hover:bg-muted/30 rounded-xl group font-bold text-foreground transition-all" asChild>
              <Link href="/portal/orders">
                <FileText className="h-4 w-4 mr-3 text-primary" />
                <span className="text-xs uppercase tracking-widest text-[10px]">Mis Pedidos</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {client.status && !isActive && (
        <Card className="border-yellow-600/30 bg-yellow-900/10 rounded-2xl">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-2">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-yellow-500 font-bold uppercase tracking-widest text-[10px]">Cuenta Pendiente</p>
              <p className="text-muted-foreground text-xs max-w-md">
                Tu cuenta está pendiente de activación. Contactá al administrador para habilitar todas las funciones.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
