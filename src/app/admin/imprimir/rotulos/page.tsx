"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Download, Eye, Printer } from "lucide-react";
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
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-3 font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="no-print bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">Rótulos de Entrega</h1>
          <p className="text-sm text-muted-foreground">
            {labels.length} rótulos ({labels.length > 0 ? Math.ceil(labels.length / 4) : 0} páginas)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showPreview ? "default" : "outline"} 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Ocultar Vista Previa" : "Vista Previa"}
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
            Descargar PDF
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="p-6">
          <LabelPreview labels={labels} />
        </div>
      ) : (
        <div className="p-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Vista Previa</h2>
            <p className="text-muted-foreground mb-6">
              Haz clic en "Vista Previa" para ver cómo quedarán los rótulos antes de imprimir o descargar el PDF.
            </p>
            <div className="bg-muted rounded-lg p-4 text-left">
              <h3 className="font-semibold mb-2 text-sm">Especificaciones:</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Formato: A4 Landscape (apaisado)</li>
                <li>• 4 rótulos por hoja (A6)</li>
                <li>• Incluye código QR</li>
                <li>• Optimizado para impresión</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .label-page { 
            page-break-after: always; 
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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
