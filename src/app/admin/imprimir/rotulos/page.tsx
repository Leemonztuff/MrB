"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Eye, Loader2, Printer } from "lucide-react";
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
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

        const response = await fetch("/api/labels/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selections }),
        });

        if (!response.ok) {
          throw new Error("Error loading preview");
        }

        const data = await response.json();
        setLabels(data.labels ?? []);
        setLogoUrl(data.logoUrl ?? null);
      } catch (err) {
        console.error("Error loading preview:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [searchParams]);

  const getSelections = (): OrderSelection[] | null => {
    const dataParam = searchParams.get("data");
    if (!dataParam) return null;

    try {
      return JSON.parse(dataParam) as OrderSelection[];
    } catch (error) {
      console.error("Invalid labels payload:", error);
      return null;
    }
  };

  const fetchPdfBlob = async (): Promise<Blob> => {
    const selections = getSelections();
    if (!selections) {
      throw new Error("No selections found");
    }

    const response = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections }),
    });

    if (!response.ok) {
      throw new Error("Error generating PDF");
    }

    return response.blob();
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await fetchPdfBlob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `rotulos-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Error al generar el PDF");
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      const blob = await fetchPdfBlob();
      const url = window.URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");

      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
            window.URL.revokeObjectURL(url);
          }, 1200);
        }, 300);
      };
    } catch (err) {
      console.error("Print error:", err);
      alert("Error al generar el PDF para impresión");
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageCount = Math.ceil(labels.length / 3) || 0;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="sticky top-0 z-50 flex flex-col items-center justify-between gap-4 border-b border-white/10 px-6 py-4 shadow-xl glass md:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
            <Printer className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">
              Rótulos de entrega
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {labels.length} rótulos listos para imprimir ({pageCount}{" "}
              {pageCount === 1 ? "hoja" : "hojas"} A4)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant={showPreview ? "default" : "outline"}
            onClick={() => setShowPreview((value) => !value)}
            className="border-white/10 font-bold"
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Ocultar previa" : "Ver en pantalla"}
          </Button>

          <Button
            onClick={handleDownloadPDF}
            disabled={labels.length === 0 || isPrinting}
            variant="secondary"
            className="bg-white font-bold text-black hover:bg-white/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>

          <Button
            onClick={handlePrint}
            disabled={labels.length === 0 || isPrinting}
            className="bg-primary font-black italic uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
          >
            {isPrinting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Imprimir físico
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="w-full">
          <LabelPreview labels={labels} logoUrl={logoUrl} />
        </div>
      ) : (
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/10 shadow-inner">
              <Printer className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-3 text-2xl font-black italic uppercase tracking-tighter text-white">
              Listo para imprimir
            </h2>
            <p className="mb-6 text-base font-medium text-muted-foreground">
              Revisa la hoja en pantalla o imprime directamente el PDF final para
              conservar el diseño exacto del rótulo.
            </p>
            <div className="space-y-2 rounded-xl border border-white/5 bg-black/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                Especificaciones técnicas
              </p>
              <p className="text-sm font-medium text-white/80">
                • Formato A4 vertical (210x297mm)
              </p>
              <p className="text-sm font-medium text-white/80">
                • 3 rótulos completos por hoja
              </p>
              <p className="text-sm font-medium text-white/80">
                • Impresión física basada en el PDF real
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LabelsPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LabelsPrintContent />
    </Suspense>
  );
}
