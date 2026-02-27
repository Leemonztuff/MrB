import dynamic from 'next/dynamic';

export const DynamicOrdersChart = dynamic(
  () => import('@/app/admin/_components/orders-chart'),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
  }
);

export const DynamicRevenueChart = dynamic(
  () => import('@/app/admin/_components/revenue-chart'),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
  }
);

export const DynamicNotifications = dynamic(
  () => import('./_components/notifications'),
  { 
    ssr: false,
    loading: () => <div className="h-10 w-10 animate-pulse bg-muted rounded-full" />
  }
);

export const DynamicDataTable = dynamic(
  () => import('@/components/ui/table'),
  { ssr: false }
);

export const DynamicPdfViewer = dynamic(
  () => import('@/components/shared/pdf-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Cargando visor PDF...</span>
      </div>
    )
  }
);

export const DynamicMap = dynamic(
  () => import('@/components/shared/map'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Cargando mapa...</span>
      </div>
    )
  }
);
