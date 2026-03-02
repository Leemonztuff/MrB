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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pageCount = Math.ceil(labels.length / 3) || 0;

  return (
    <div className={isPrinting ? "print-mode" : ""}>
      {!isPrinting && (
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Rótulos de Entrega</h1>
            <p className="text-sm text-muted-foreground">
              {labels.length} rótulos ({pageCount} {pageCount === 1 ? 'página' : 'páginas'})
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showPreview ? "default" : "outline"} 
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? "Ocultar" : "Vista Previa"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePrint}
              disabled={labels.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              disabled={labels.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      )}

      {showPreview ? (
        <div className="p-4 bg-gray-100 min-h-screen">
          <LabelPreview labels={labels} />
        </div>
      ) : !isPrinting ? (
        <div className="p-8">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Vista Previa</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Haz clic en "Vista Previa" para ver los rótulos antes de imprimir.
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <div className="font-medium mb-1">Especificaciones:</div>
              <div>• A4 Portrait • 3 rótulos por hoja • Con QR</div>
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
          .print-only, .print-only * { visibility: visible; }
          .print-only { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
          }
          @page { 
            size: portrait; 
            margin: 3mm; 
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
