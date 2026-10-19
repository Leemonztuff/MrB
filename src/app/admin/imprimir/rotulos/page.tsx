'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getLabelData } from '@/app/admin/actions/orders.actions';
import { getPublicLogoUrl, getPublicLabelLogoUrl } from '@/app/admin/actions/settings.actions';
import { generateQRBase64 } from '@/lib/qr-generator';
import { getPrintSelections, clearPrintSelections } from '@/lib/print-helpers';
import { LabelPreview } from './label-preview';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LabelData } from '@/types';

function LabelsPrintContent() {
  const router = useRouter();
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const selections = getPrintSelections();
      if (!selections || selections.length === 0) {
        setError('No se proporcionaron datos de pedidos. Abre esta pagina desde el panel de administracion.');
        setLoading(false);
        return;
      }

      try {
        const [labelResult, logo, labelLogo] = await Promise.all([
          getLabelData(selections.map(o => o.id)),
          getPublicLogoUrl(),
          getPublicLabelLogoUrl(),
        ]);

        // El rótulo usa el logo horizontal (912x168); si no existe, cae al icono cuadrado.
        setLogoUrl(labelLogo.data ?? logo.data ?? null);

        if (labelResult.error || !labelResult.data) {
          throw new Error(labelResult.error?.message || 'Error al cargar pedidos');
        }

        const orders = labelResult.data;
        const origin = window.location.origin;

        // Build all label data entries
        const labelEntries: { order: typeof orders[0]; bundleIdx: number; totalBundles: number; qrUrl: string }[] = [];
        for (const sel of selections) {
          const order = orders.find(o => o.id === sel.id);
          if (order) {
            const token = order.confirmation_token || '';
            const qrUrl = `${origin}/api/pedido/confirmar/${order.id}?token=${token}`;
            for (let i = 1; i <= sel.bundles; i++) {
              labelEntries.push({ order, bundleIdx: i, totalBundles: sel.bundles, qrUrl });
            }
          }
        }

        // Generate all QR codes in parallel
        const qrDataUrls = await Promise.all(
          labelEntries.map(entry => generateQRBase64(entry.qrUrl, 150))
        );

        const allLabels: LabelData[] = labelEntries.map((entry, idx) => ({
          ...entry.order,
          bundleIdx: entry.bundleIdx,
          totalBundles: entry.totalBundles,
          _qrDataUrl: qrDataUrls[idx],
        }));

        setLabels(allLabels);
        clearPrintSelections();
      } catch (err: any) {
        console.error('Print Error:', err);
        let message = 'Error al procesar los datos. Verifica que los pedidos sean validos.';

        if (err?.message?.includes('No tienes permisos')) {
          message = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
        } else if (err?.message?.includes('Pedido no encontrado')) {
          message = 'Uno o mas pedidos no fueron encontrados. Pueden haber sido eliminados.';
        } else if (err?.message?.includes('Failed to fetch')) {
          message = 'Error de conexion. Verifica tu conexion a internet e intenta nuevamente.';
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Generando rótulos...</p>
        </div>
        <p className="text-sm text-muted-foreground">Preparando PDF con QR local</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Error al generar rótulos</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/admin')} variant="outline">
            Volver al Admin
          </Button>
        </div>
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">Sin rótulos</h1>
          <p className="text-muted-foreground mb-6">No se encontraron pedidos para generar rótulos.</p>
          <Button onClick={() => router.push('/admin')} variant="outline">
            Volver al Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LabelPreview
      labels={labels}
      logoUrl={logoUrl}
      onBack={() => router.push('/admin')}
    />
  );
}

export default function LabelsPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
        </div>
      }
    >
      <LabelsPrintContent />
    </Suspense>
  );
}
