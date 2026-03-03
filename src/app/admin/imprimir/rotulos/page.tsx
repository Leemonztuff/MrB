"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Download, Eye, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabelPreview } from "./_components/label-preview";

interface OrderSelection {
  id: string;
  bundles: number;
}

interface LabelData {
  id: string;
  client_name_cache: string;
  created_at: string;
  notes: string | null;
  bundleIdx: number;
  totalBundles: number;
  clients: {
    contact_name: string | null;
    address: string | null;
    delivery_window: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

function LabelsPrintContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const selections: OrderSelection[] = JSON.parse(dataParam);

        const response = await fetch('/api/labels/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selections }),
        });

        if (response.ok) {
          const data = await response.json();
          setLabels(data.labels);
        }
      } catch (err) {
        console.error("Error loading preview:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  const handleDownloadPDF = async () => {
    const dataParam = searchParams.get("data");
    if (!dataParam) return;

    try {
      const selections = JSON.parse(dataParam);

      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections }),
      });

      if (!response.ok) throw new Error('Error generating PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotulos-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert('Error al generar el PDF');
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageCount = Math.ceil(labels.length / 3) || 0;

  return (
    <div className={`min-h-screen bg-muted/20 ${isPrinting ? "print-mode" : ""}`}>
      {!isPrinting && (
        <div className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
              <Printer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Rótulos de Entrega</h1>
              <p className="text-sm text-muted-foreground font-medium">
                {labels.length} rótulos listas para imprimir ({pageCount} {pageCount === 1 ? 'hoja' : 'hojas'} A4)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant={showPreview ? "default" : "outline"}
              onClick={() => setShowPreview(!showPreview)}
              className="font-bold border-white/10"
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? "Ocultar Previa" : "Ver en Pantalla"}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={labels.length === 0}
              variant="secondary"
              className="font-bold bg-white text-black hover:bg-white/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
            <Button
              onClick={handlePrint}
              disabled={labels.length === 0}
              className="font-black italic uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Físico
            </Button>
          </div>
        </div>
      )}

      {showPreview ? (
        <div className="w-full">
          <LabelPreview labels={labels} />
        </div>
      ) : !isPrinting ? (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full glass rounded-3xl border border-white/10 p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary/20 shadow-inner">
              <Printer className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-3">Listo para Imprimir</h2>
            <p className="text-base text-muted-foreground font-medium mb-6">
              Haz clic en "Ver en Pantalla" para revisar la hoja o descarga directamente el PDF de alta resolución.
            </p>
            <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
              <p className="text-[10px] uppercase font-black tracking-widest text-primary">Especificaciones Técnicas</p>
              <p className="text-sm font-medium text-white/80">• Formato A4 Vertical (210x297mm)</p>
              <p className="text-sm font-medium text-white/80">• 3 Rótulos completos por hoja</p>
              <p className="text-sm font-medium text-white/80">• QR ultra-nítido para escaneo logístico</p>
            </div>
          </div>
        </div>
      ) : null}

      {isPrinting && (
        <div className="print-only">
          <LabelPreview labels={labels} />
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          body { margin: 0 !important; padding: 0 !important; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
          }
          @page { 
            size: portrait; 
            margin: 0; /* CRITICAL FIX: The previous 3mm margin shrank 100% width causing overflow cut-offs */
          }
        }
      `}</style>
    </div>
  );
}

export default function LabelsPrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <LabelsPrintContent />
    </Suspense>
  );
}
