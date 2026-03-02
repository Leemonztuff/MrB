"use client";

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

export function LabelPreview({ labels, baseUrl = 'http://localhost:9003' }: LabelPreviewProps) {
  const labelsPerPage = 4;
  const pages: LabelData[][] = [];
  
  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage));
  }

  return (
    <div className="space-y-8">
      {pages.map((pageLabels, pageIndex) => (
        <div 
          key={pageIndex} 
          className="label-page bg-white shadow-lg"
          style={{
            width: '297mm',
            minHeight: '210mm',
            padding: '5mm',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '5mm',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {pageLabels.map((label, labelIndex) => (
            <LabelCard 
              key={`${label.id}-${labelIndex}`} 
              label={label} 
              baseUrl={baseUrl}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function LabelCard({ label, baseUrl }: { label: LabelData; baseUrl: string }) {
  const shortId = label.id?.slice(-6).toUpperCase() || 'N/A';
  const date = new Date(label.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${baseUrl}/api/pedido/confirmar/${label.id}`)}`;

  return (
    <div 
      className="label-card"
      style={{
        border: '1px solid #000',
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
          padding: '6mm 8mm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '10mm', fontWeight: 900, letterSpacing: '1mm' }}>
          MR. BLONDE
        </span>
        <span style={{ fontSize: '9mm', fontWeight: 700 }}>#{shortId}</span>
      </div>

      {/* Content */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          padding: '6mm',
          gap: '4mm',
        }}
      >
        {/* Main Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3mm', minWidth: 0 }}>
          <div style={{ 
            fontSize: '11mm', 
            fontWeight: 800, 
            textTransform: 'uppercase',
            color: '#000',
            lineHeight: 1.2,
          }}>
            {label.client_name_cache || 'Cliente'}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '3mm', fontSize: '8mm' }}>
            <span>📍</span>
            <span style={{ fontSize: '9mm', fontWeight: 600, color: '#000' }}>
              {label.clients?.address || 'Sin dirección'}
            </span>
          </div>

          {label.clients?.delivery_window && (
            <div 
              style={{
                backgroundColor: '#fffbeb',
                padding: '2mm 4mm',
                borderRadius: '2mm',
                borderLeft: '2mm solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '2mm',
                marginTop: 'auto',
              }}
            >
              <span style={{ fontSize: '7mm' }}>📅</span>
              <span style={{ fontSize: '8mm', fontWeight: 600, color: '#000' }}>
                {label.clients.delivery_window}
              </span>
            </div>
          )}

          {label.notes && (
            <div 
              style={{
                backgroundColor: '#fef3c7',
                padding: '3mm 5mm',
                borderRadius: '2mm',
                borderLeft: '2mm solid #f59e0b',
                marginTop: 'auto',
              }}
            >
              <span style={{ fontSize: '6mm', color: '#000', fontStyle: 'italic' }}>
                📝 {label.notes.length > 50 ? label.notes.substring(0, 47) + '...' : label.notes}
              </span>
            </div>
          )}

          <div 
            style={{
              fontSize: '6mm',
              color: '#666',
              marginTop: 'auto',
              paddingTop: '3mm',
              borderTop: '0.5mm dashed #ddd',
            }}
          >
            Contacto: {label.clients?.phone || label.clients?.email || 'Sin contacto'}
          </div>
        </div>

        {/* QR Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2mm' }}>
          <Image
            src={qrUrl}
            alt="QR Code"
            width={50}
            height={50}
            unoptimized
            style={{ width: '50mm', height: '50mm', border: '1px solid #000', borderRadius: '2mm' }}
          />
          <div 
            style={{
              backgroundColor: '#000',
              color: '#E6D5A7',
              padding: '2mm 6mm',
              fontSize: '9mm',
              fontWeight: 900,
              borderRadius: '2mm',
              textTransform: 'uppercase',
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
          padding: '2mm 8mm',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ fontSize: '6mm', color: '#666' }}>{date}</span>
      </div>
    </div>
  );
}
