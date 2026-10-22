'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { LabelDocument } from './label-pdf';
import { markOrdersAsPrinted } from '@/app/admin/actions/orders.actions';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LabelData, LabelFormat } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [confirmPrintedOpen, setConfirmPrintedOpen] = useState(false);
  const [isMarkingPrinted, setIsMarkingPrinted] = useState(false);
  const [markedOrderIds, setMarkedOrderIds] = useState<string[]>([]);
  const [printError, setPrintError] = useState<string | null>(null);
  const { toast } = useToast();
  const totalPages = Math.ceil(labels.length / format);

  const orderIds = useMemo(() => [...new Set(labels.map(l => l.id))], [labels]);
  const ordersToMark = useMemo(
    () => [...new Set(labels
      .filter(label => label.status === 'armado' && !label.printed_at && !markedOrderIds.includes(label.id))
      .map(label => label.id))],
    [labels, markedOrderIds]
  );

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
    setPrintError(null);
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
        if (!iframe.contentWindow) throw new Error('No se pudo abrir el documento de impresión.');
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (error) {
        console.error('Error al imprimir los rótulos:', error);
        const message = 'No se pudo abrir la impresión. Descarga el PDF e imprimilo manualmente.';
        setPrintError(message);
        toast({ title: 'No se pudieron imprimir los rótulos', description: message, variant: 'destructive' });
      } finally {
        window.setTimeout(() => iframe.remove(), 3000);
      }
    };
    iframe.onerror = () => {
      const message = 'No se pudo cargar el PDF para imprimir. Descargalo e intentá imprimirlo manualmente.';
      setPrintError(message);
      toast({ title: 'Error al cargar los rótulos', description: message, variant: 'destructive' });
      iframe.remove();
    };
    document.body.appendChild(iframe);
  }, [instance.url, toast]);

  const confirmPrinted = async () => {
    if (ordersToMark.length === 0) return;
    setIsMarkingPrinted(true);
    setPrintError(null);
    try {
      const result = await markOrdersAsPrinted(ordersToMark);
      if (result.error) throw new Error(result.error.message);
      setMarkedOrderIds(current => [...new Set([...current, ...ordersToMark])]);
      setConfirmPrintedOpen(false);
      toast({
        title: 'Impresión confirmada',
        description: `Se habilitó el despacho para ${ordersToMark.length} pedido(s).`,
      });
    } catch (error) {
      console.error('Error al confirmar la impresión de rótulos:', error);
      const message = error instanceof Error
        ? error.message
        : 'No se pudo confirmar la impresión. Intenta nuevamente.';
      setPrintError(`${message} El despacho seguirá bloqueado hasta que se confirme la impresión.`);
      toast({
        title: 'No se pudo confirmar la impresión',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsMarkingPrinted(false);
    }
  };

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
                <a href={instance.url} download={fileName}>
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
        <div className="max-w-6xl mx-auto px-6 pb-4">
          {ordersToMark.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground">
                Descargar o abrir la impresión no confirma que los rótulos se hayan impreso.
                Después de imprimirlos, confirmalo aquí para habilitar el despacho.
              </p>
              <Button
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => setConfirmPrintedOpen(true)}
                disabled={isMarkingPrinted}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar rótulos impresos
              </Button>
            </div>
          ) : markedOrderIds.length > 0 ? (
            <p role="status" className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Impresión confirmada. El despacho está habilitado para estos pedidos.
            </p>
          ) : null}
          {printError && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {printError}
            </p>
          )}
        </div>
      </header>

      <AlertDialog open={confirmPrintedOpen} onOpenChange={setConfirmPrintedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Ya imprimiste los rótulos?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmá solo después de que los rótulos hayan salido impresos. Descargar el PDF o abrir el diálogo de impresión no habilita el despacho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingPrinted}>Todavía no</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmPrinted();
              }}
              disabled={isMarkingPrinted}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isMarkingPrinted && <Loader2 className="h-4 w-4 animate-spin" />}
              {isMarkingPrinted ? 'Confirmando...' : 'Sí, ya los imprimí'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
