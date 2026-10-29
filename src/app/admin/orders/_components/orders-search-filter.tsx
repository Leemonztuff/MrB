'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';
import { Search, X, Filter, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function OrdersSearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentQuery = searchParams.get('query') || '';
  const currentWorkflow = searchParams.get('workflow');
  const currentLabels = searchParams.get('labels');
  const currentOverdue = searchParams.get('overdue');
  const currentStatus = searchParams.get('status');

  const [searchTerm, setSearchTerm] = useState(currentQuery);

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set('query', term.trim());
    } else {
      params.delete('query');
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearSearch = () => {
    handleSearch('');
  };

  const hasActiveFilters = Boolean(
    currentQuery || currentWorkflow || currentLabels || currentOverdue || currentStatus
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar por cliente o ID de pedido..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9 h-10 glass border-white/10 bg-white/5 focus-visible:ring-primary/50 text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Acceso rápido al Tablero Kanban */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-10 gap-2 border-white/10 bg-white/5 hover:bg-white/10 shrink-0 text-xs"
        >
          <Link href="/admin">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span>Tablero Kanban</span>
          </Link>
        </Button>
      </div>

      {/* Chips de Filtros Activos con opción para limpiar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-muted-foreground/80 flex items-center gap-1 font-semibold">
            <Filter className="h-3.5 w-3.5" />
            Filtros activos:
          </span>

          {currentWorkflow === 'preparation' && (
            <Badge variant="outline" className="border-violet-500/40 bg-violet-500/10 text-violet-400 gap-1.5 py-0.5">
              <span>Para preparar</span>
            </Badge>
          )}

          {currentWorkflow === 'whatsapp' && (
            <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-400 gap-1.5 py-0.5">
              <span>Por confirmar WhatsApp</span>
            </Badge>
          )}

          {currentLabels === 'pending' && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1.5 py-0.5">
              <span>Rótulos pendientes</span>
            </Badge>
          )}

          {currentOverdue === 'true' && (
            <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400 gap-1.5 py-0.5">
              <span>Demorados +48h</span>
            </Badge>
          )}

          {currentStatus && (
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 py-0.5">
              <span>Estado: {currentStatus}</span>
            </Badge>
          )}

          {currentQuery && (
            <Badge variant="outline" className="border-white/20 bg-white/5 text-foreground gap-1.5 py-0.5">
              <span>Texto: &quot;{currentQuery}&quot;</span>
            </Badge>
          )}

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            <Link href="/admin/orders">
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar filtros
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

