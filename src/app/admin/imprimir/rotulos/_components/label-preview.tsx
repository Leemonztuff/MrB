"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import * as QRCode from "qrcode";

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

interface LabelPreviewProps {
  labels: LabelData[];
  baseUrl?: string;
}

export function LabelPreview({ labels, baseUrl }: LabelPreviewProps) {
  const [currentBaseUrl, setCurrentBaseUrl] = useState(baseUrl || '');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!baseUrl && typeof window !== 'undefined') {
      setCurrentBaseUrl(window.location.origin);
    }
  }, [baseUrl]);

  useEffect(() => {
    const generateAll = async () => {
      const codes: Record<string, string> = {};
      for (const label of labels) {
        if (codes[label.id]) continue;
        const url = `${currentBaseUrl}/pedido/confirmar/${label.id}`;
        try {
          codes[label.id] = await QRCode.toDataURL(url, {
            margin: 1,
            width: 600,
            color: { dark: '#000000', light: '#ffffff' }
          });
        } catch (err) {
          console.error("Error generating QR:", err);
        }
      }
      setQrCodes(codes);
    };
    if (currentBaseUrl && labels.length > 0) generateAll();
  }, [currentBaseUrl, labels]);

  const labelsPerPage = 3;
  const pages: LabelData[][] = [];

  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage));
  }

  return (
    <div className="flex flex-col gap-4 items-center bg-muted/20 p-8 min-h-screen">
      {pages.map((pageLabels, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white shadow-2xl overflow-hidden"
          style={{
            width: '210mm',
            height: '297mm',
            padding: '10mm',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: '6mm',
            boxSizing: 'border-box',
            pageBreakAfter: 'always',
          }}
        >
          {pageLabels.map((label, labelIndex) => (
            <CompactLabelCard
              key={`${label.id}-${labelIndex}`}
              label={label}
              qrDataUrl={qrCodes[label.id]}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CompactLabelCard({ label, qrDataUrl }: { label: LabelData; qrDataUrl?: string }) {
  const shortId = label.id?.slice(-6).toUpperCase() || 'N/A';
  const date = new Date(label.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <div
      style={{
        border: '3px solid #000',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#000',
          color: '#fff',
          padding: '8mm 10mm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '18pt',
          fontWeight: 900,
          borderBottom: '3px solid #000',
        }}
      >
        <span style={{ letterSpacing: '0.1em' }}>MR. BLONDE</span>
        <span style={{ opacity: 0.8 }}>#{shortId}</span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          padding: '10mm',
          gap: '10mm',
        }}
      >
        {/* Info Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5mm', minWidth: 0 }}>
          <div style={{
            fontSize: '22pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: '#000',
            lineHeight: 1.1,
            marginBottom: '2mm',
          }}>
            {(label.client_name_cache || 'CLIENTE').toUpperCase()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
            <span style={{ fontSize: '11pt', fontWeight: 900, color: '#000', opacity: 0.5, letterSpacing: '0.05em' }}>DIRECCION:</span>
            <span style={{ fontSize: '15pt', fontWeight: 700, color: '#000', lineHeight: 1.3 }}>
              {label.clients?.address || 'SIN DATOS'}
            </span>
          </div>

          {label.clients?.delivery_window && (
            <div
              style={{
                backgroundColor: '#000',
                color: '#fff',
                padding: '4mm 6mm',
                borderRadius: '4px',
                marginTop: 'auto',
                display: 'inline-block',
                width: 'fit-content',
              }}
            >
              <span style={{ fontSize: '12pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                HORARIO: {label.clients.delivery_window}
              </span>
            </div>
          )}

          {label.notes && (
            <div
              style={{
                border: '2px solid #000',
                padding: '4mm 6mm',
                borderRadius: '4px',
                marginTop: label.clients?.delivery_window ? '2mm' : 'auto',
              }}
            >
              <span style={{ fontSize: '11pt', color: '#000', fontWeight: 700 }}>
                NOTAS: {label.notes}
              </span>
            </div>
          )}
        </div>

        {/* QR & Bundle Info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6mm', width: '50mm' }}>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR"
              style={{ width: '45mm', height: '45mm', display: 'block' }}
            />
          ) : (
            <div style={{ width: '45mm', height: '45mm', backgroundColor: '#f5f5f5', borderRadius: '4px' }} />
          )}

          <div
            style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '4mm 8mm',
              fontSize: '16pt',
              fontWeight: 900,
              borderRadius: '4px',
              minWidth: '20mm',
              textAlign: 'center',
            }}
          >
            {label.bundleIdx}/{label.totalBundles}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: '#f8f8f8',
          padding: '4mm 10mm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9pt',
          fontWeight: 700,
          color: '#666',
          borderTop: '1px solid #eee',
        }}
      >
        <span>CONTACTO: {label.clients?.phone || 'SIN DATOS'}</span>
        <span>FECHA: {date}</span>
      </div>
    </div>
  );
}
