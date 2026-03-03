"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

  useEffect(() => {
    if (!baseUrl && typeof window !== 'undefined') {
      setCurrentBaseUrl(window.location.origin);
    }
  }, [baseUrl]);

  const labelsPerPage = 3;
  const pages: LabelData[][] = [];

  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage));
  }

  return (
    <div className="flex flex-col gap-2 items-center">
      {pages.map((pageLabels, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white shadow"
          style={{
            width: '210mm',
            height: '297mm',
            padding: '5mm',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: '3mm',
            boxSizing: 'border-box',
            pageBreakAfter: 'always',
          }}
        >
          {pageLabels.map((label, labelIndex) => (
            <CompactLabelCard
              key={`${label.id}-${labelIndex}`}
              label={label}
              baseUrl={currentBaseUrl}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CompactLabelCard({ label, baseUrl }: { label: LabelData; baseUrl: string }) {
  const shortId = label.id?.slice(-6).toUpperCase() || 'N/A';
  const date = new Date(label.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=48x48&data=${encodeURIComponent(`${baseUrl}/api/pedido/confirmar/${label.id}`)}`;

  return (
    <div
      style={{
        border: '2px solid #000',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#1a1a1a',
          color: '#E6D5A7',
          padding: '4mm 6mm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10pt',
          fontWeight: 900,
        }}
      >
        <span>MR. BLONDE</span>
        <span style={{ fontWeight: 700 }}>#{shortId}</span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          padding: '5mm',
          gap: '5mm',
        }}
      >
        {/* Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2mm', minWidth: 0 }}>
          <div style={{
            fontSize: '12pt',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#000',
          }}>
            {(label.client_name_cache || 'CLIENTE').toUpperCase()}
          </div>

          <div style={{ fontSize: '8pt', color: '#666' }}>
            <span style={{ fontWeight: 700 }}>DIRECCION:</span>
          </div>
          <div style={{ fontSize: '9pt', fontWeight: 700, color: '#000' }}>
            {label.clients?.address || 'SIN DATOS'}
          </div>

          {label.clients?.delivery_window && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                padding: '2mm 3mm',
                borderRadius: '2mm',
                borderLeft: '3mm solid #f59e0b',
                marginTop: 'auto',
              }}
            >
              <span style={{ fontSize: '8pt', fontWeight: 700, color: '#000' }}>
                {label.clients.delivery_window}
              </span>
            </div>
          )}

          {label.notes && (
            <div
              style={{
                backgroundColor: '#fef3c7',
                padding: '2mm 3mm',
                borderRadius: '2mm',
                borderLeft: '3mm solid #f59e0b',
              }}
            >
              <span style={{ fontSize: '7pt', fontStyle: 'italic', color: '#000' }}>
                {label.notes.length > 50 ? label.notes.substring(0, 47) + '...' : label.notes}
              </span>
            </div>
          )}

          <div style={{ fontSize: '7pt', color: '#666', marginTop: 'auto' }}>
            CONTACTO: {label.clients?.phone || label.clients?.email || 'SIN DATOS'}
          </div>
        </div>

        {/* QR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2mm' }}>
          <Image
            src={qrUrl}
            alt="QR"
            width={48}
            height={48}
            unoptimized
            style={{ width: '24mm', height: '24mm', border: '1px solid #000' }}
          />
          <div
            style={{
              backgroundColor: '#000',
              color: '#E6D5A7',
              padding: '2mm 4mm',
              fontSize: '8pt',
              fontWeight: 900,
              borderRadius: '2mm',
            }}
          >
            {label.bundleIdx}/{label.totalBundles}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '2mm 6mm',
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: '6pt',
          color: '#666',
        }}
      >
        {date}
      </div>
    </div>
  );
}
