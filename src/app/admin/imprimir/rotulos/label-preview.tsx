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
  const confirmedOrderIds = useMemo(
    () => [...new Set(labels.filter(label => label.printed_at).map(label => label.id))],
    [labels]
  );
  const ordersToMark = useMemo(
    () => [...new Set(labels
      .filter(label => label.status === 'armado' && !label.printed_at && !markedOrderIds.includes(label.id))
      .map(label => label.id))],
    [labels, markedOrderIds]
  );
  const totalConfirmedOrders = new Set([...confirmedOrderIds, ...markedOrderIds]).size;

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
    if (!instance.url || instance.loading || instance.error) return;
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
        const message = 'No se pudo abrir la impresión. Descargá el PDF e imprimilo manualmente.';
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
  }, [instance.url, instance.loading, instance.error, toast]);

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

  const previewSrc = instance.url && !instance.loading && !instance.error
    ? `${instance.url}#toolbar=0&navpanes=0&statusbar=0`
    : undefined;

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
                Rótulos de envío
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div role="group" aria-label="Rótulos por hoja" className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {([1, 2, 3] as LabelFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  aria-pressed={format === f}
                  disabled={instance.loading}
                  className={`min-h-11 px-3 text-xs font-medium rounded-md transition-colors disabled:cursor-wait disabled:opacity-60 ${
                    format === f
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f} {f === 1 ? 'rótulo' : 'rótulos'}/hoja
                </button>
              ))}
            </div>

            {instance.url && !instance.loading && !instance.error ? (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={instance.url} download={fileName}>
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled className="gap-2">
                {instance.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {instance.error ? 'PDF no disponible' : instance.loading ? 'Generando...' : 'PDF no disponible'}
              </Button>
            )}

            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handlePrint}
              disabled={!instance.url || instance.loading || Boolean(instance.error)}
            >
              <Printer className="h-4 w-4" />
              Imprimir rótulos
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-3 text-xs text-muted-foreground">
          {orderIds.length} {orderIds.length === 1 ? 'pedido' : 'pedidos'} · {labels.length} {labels.length === 1 ? 'rótulo' : 'rótulos'} · {totalPages} {totalPages === 1 ? 'hoja' : 'hojas'} · A4
          {instance.error && (
            <p role="alert" className="mt-2 text-destructive">
              No se pudo generar el PDF. Volvé al panel y generá los rótulos nuevamente.
            </p>
          )}
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-4">
          {ordersToMark.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground">
                Descargar el PDF o abrir el diálogo no confirma la impresión. Imprimí los rótulos
                y después confirmá aquí la impresión de {ordersToMark.length}{' '}
                {ordersToMark.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}.
                {totalConfirmedOrders > 0 && ` ${totalConfirmedOrders} ${totalConfirmedOrders === 1 ? 'pedido ya tiene' : 'pedidos ya tienen'} la impresión confirmada.`}
              </p>
              <Button
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => setConfirmPrintedOpen(true)}
                disabled={isMarkingPrinted || instance.loading || Boolean(instance.error)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar impresión de {ordersToMark.length} {ordersToMark.length === 1 ? 'pedido' : 'pedidos'}
              </Button>
            </div>
          ) : totalConfirmedOrders > 0 ? (
            <p role="status" className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Impresión confirmada para {totalConfirmedOrders} {totalConfirmedOrders === 1 ? 'pedido' : 'pedidos'}.
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
              Vas a confirmar la impresión de {ordersToMark.length}{' '}
              {ordersToMark.length === 1 ? 'pedido' : 'pedidos'}. Hacelo solo después
              de que los rótulos hayan salido impresos; esta confirmación habilita su despacho.
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
              <div className="p-12 text-center text-sm text-muted-foreground">
                El PDF no está disponible. Volvé al panel y generá los rótulos nuevamente.
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
