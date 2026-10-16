'use client';

import { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { LabelDocument } from './label-pdf';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft, FileText } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border px-6 py-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-lg font-black italic tracking-tight">
                Vista Previa de <span className="text-primary">Rótulos</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {labels.length} rótulo(s) · {totalPages} página(s)
              </p>
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
                  {f} {f === 1 ? 'rótulo' : 'rótulos'}/pág
                </button>
              ))}
            </div>

            <PDFDownloadLink
              document={<LabelDocument labels={labels} format={format} logoUrl={logoUrl} />}
              fileName={`rotulos-${new Date().toISOString().slice(0, 10)}.pdf`}
            >
              {({ loading }) => (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {loading ? 'Generando...' : 'Descargar PDF'}
                </Button>
              )}
            </PDFDownloadLink>

            <Button
              size="sm"
              className="gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 print-area">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden ring-1 ring-black/5">
          <PDFViewer width="100%" height={800} showToolbar={false}>
            <LabelDocument labels={labels} format={format} logoUrl={logoUrl} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
