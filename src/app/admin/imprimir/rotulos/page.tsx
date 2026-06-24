'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getLabelData } from '@/app/admin/actions/orders.actions';
import { getPublicLogoUrl } from '@/app/admin/actions/settings.actions';
import { generateQRBase64 } from '@/lib/qr-generator';
import { LabelPreview } from './label-preview';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LabelData } from '@/types';

function LabelsPrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('No se proporcionaron datos de pedidos.');
      setLoading(false);
      return;
    }

    try {
      const selections: { id: string; bundles: number }[] = JSON.parse(dataParam);
      const [labelResult, logo] = await Promise.all([
        getLabelData(selections.map(o => o.id)),
        getPublicLogoUrl(),
      ]);

      setLogoUrl(logo);

      if (labelResult.error || !labelResult.data) {
        throw new Error(labelResult.error?.message || 'Error al cargar pedidos');
      }

      const orders = labelResult.data;
      const origin = window.location.origin;
      const allLabels: LabelData[] = [];

      for (const sel of selections) {
        const order = orders.find(o => o.id === sel.id);
        if (order) {
          for (let i = 1; i <= sel.bundles; i++) {
            const token = (order as any).confirmation_token || '';
            const qrUrl = `${origin}/api/pedido/confirmar/${order.id}?token=${token}`;
            const qrDataUrl = await generateQRBase64(qrUrl, 150);
            allLabels.push({
              ...order,
              bundleIdx: i,
              totalBundles: sel.bundles,
              _qrDataUrl: qrDataUrl,
            });
          }
        }
      }

      setLabels(allLabels);
    } catch (err) {
      console.error('Print Error:', err);
      setError('Error al procesar los datos. Verifica que los pedidos sean validos.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
          <p className="text-lg font-medium text-gray-900">Generando rotulos...</p>
        </div>
        <p className="text-sm text-gray-500">Preparando PDF con QR local</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error al generar rotulos</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => router.push('/admin')} variant="outline">
            Volver al Admin
          </Button>
        </div>
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sin rotulos</h1>
          <p className="text-gray-500 mb-6">No se encontraron pedidos para generar rotulos.</p>
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
