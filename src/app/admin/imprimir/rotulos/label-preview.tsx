'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { LabelDocument } from './label-pdf';
import { markOrdersAsPrinted } from '@/app/admin/actions/orders.actions';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft, Loader2 } from 'lucide-react';
import type { LabelData, LabelFormat } from '@/types';

export function LabelPreview({
  labels,
  logoUrl,
  onBack,
}: {
  labels: LabelData[];
  logoUrl?: string | null;
  onBack: () => void;
}) {
  const [format, setFormat] = useState<LabelFormat>(3);
  const totalPages = Math.ceil(labels.length / format);

  // Los rótulos repetidos por bulto comparten el mismo pedido: se deduplican.
  const orderIds = useMemo(() => [...new Set(labels.map(l => l.id))], [labels]);

  // El pedido se marca como impreso recién cuando el usuario imprime o descarga,
  // no al abrir la vista previa. Ese flag habilita el despacho en el servidor.
  const markPrinted = useCallback(() => {
    if (orderIds.length === 0) return;
    markOrdersAsPrinted(orderIds).catch(() => {});
  }, [orderIds]);

  const pdfDocument = useMemo(
    () => <LabelDocument labels={labels} format={format} logoUrl={logoUrl} />,
    [labels, format, logoUrl]
  );

  const [instance, update] = usePDF({ document: pdfDocument });

  // Regenera el PDF cuando cambia el formato (el documento inicial ya se pasa a usePDF).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    update(pdfDocument);
  }, [pdfDocument, update]);

  const fileName = `rotulos-${new Date().toISOString().slice(0, 10)}.pdf`;

  // Imprime SOLO el PDF (no el chrome de la app): carga el blob en un iframe oculto
  // y dispara la impresión nativa del documento.
  const handlePrint = useCallback(() => {
    if (!instance.url) return;
    markPrinted();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
    });
    iframe.src = instance.url;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        window.setTimeout(() => iframe.remove(), 3000);
      }
    };
    document.body.appendChild(iframe);
  }, [instance.url, markPrinted]);

  const previewSrc = instance.url ? `${instance.url}#toolbar=0&navpanes=0&statusbar=0` : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 no-print bg-card/70 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary leading-none">
                Mr. Blonde
              </p>
              <h1 className="text-lg font-black italic tracking-tight leading-tight">
                Generador de Rótulos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {([1, 2, 3] as LabelFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    format === f
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f} {f === 1 ? 'rótulo' : 'rótulos'}/hoja
                </button>
              ))}
            </div>

            {instance.url ? (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={instance.url} download={fileName} onClick={markPrinted}>
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </Button>
            )}

            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handlePrint}
              disabled={!instance.url}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-3 text-xs text-muted-foreground">
          {labels.length} rótulo(s) · {totalPages} hoja(s) · A4
        </div>
      </header>

      <main className="flex-1 bg-[radial-gradient(ellipse_at_top,hsl(var(--card))_0%,hsl(var(--background))_60%)] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-white">
            {instance.error ? (
              <div className="p-12 text-center text-sm text-destructive">
                No se pudo generar la vista previa: {instance.error}
              </div>
            ) : previewSrc ? (
              <iframe
                title="Vista previa de rótulos"
                src={previewSrc}
                className="w-full border-0"
                style={{ height: '78vh' }}
              />
            ) : (
              <div className="h-[78vh] flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generando vista previa...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
