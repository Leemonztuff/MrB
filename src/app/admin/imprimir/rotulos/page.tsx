
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderSelection {
  id: string;
  bundles: number;
}

function LabelsPrintContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selectionCount, setSelectionCount] = useState(0);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) {
      setLoading(false);
      return;
    }

    try {
      const selections: OrderSelection[] = JSON.parse(dataParam);
      let totalBundles = 0;
      selections.forEach((sel) => {
        totalBundles += sel.bundles;
      });
      setSelectionCount(totalBundles);
    } catch (err) {
      console.error("Error parsing data:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleDownloadPDF = async () => {
    const dataParam = searchParams.get("data");
    if (!dataParam) return;

    try {
      const selections = JSON.parse(dataParam);
      
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selections }),
      });

      if (!response.ok) {
        throw new Error('Error generating PDF');
      }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-3 font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Generar Rótulos</h1>
          <p className="text-muted-foreground mb-6">
            Se generarán <strong>{selectionCount}</strong> rótulos en formato PDF profesional.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={handleDownloadPDF}
              className="w-full h-12 text-base font-semibold"
            >
              <Download className="mr-2 h-5 w-5" />
              Descargar PDF
            </Button>

            <p className="text-xs text-muted-foreground">
              El PDF contiene 4 rótulos por página (formato A6)
            </p>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-3 text-sm">Especificaciones del PDF:</h3>
            <ul className="text-xs text-muted-foreground space-y-1 text-left">
              <li>• Formato: A4 con 4 rótulos por hoja</li>
              <li>• Tamaño de rótulo: A6 apaisado</li>
              <li>• Incluye código QR para confirmación</li>
              <li>• Optimizado para impresión</li>
            </ul>
          </div>
        </div>
      </div>
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
