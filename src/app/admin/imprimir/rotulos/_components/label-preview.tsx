"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
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
  logoUrl?: string | null;
}

export function LabelPreview({
  labels,
  baseUrl,
  logoUrl = null,
}: LabelPreviewProps) {
  const [currentBaseUrl, setCurrentBaseUrl] = useState(baseUrl || "");
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!baseUrl && typeof window !== "undefined") {
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
            margin: 2,
            width: 800,
            color: { dark: "#000000", light: "#ffffff" },
          });
        } catch (error) {
          console.error("Error generating QR:", error);
        }
      }

      setQrCodes(codes);
    };

    if (currentBaseUrl && labels.length > 0) {
      void generateAll();
    }
  }, [currentBaseUrl, labels]);

  const labelsPerPage = 3;
  const pages: LabelData[][] = [];

  for (let index = 0; index < labels.length; index += labelsPerPage) {
    pages.push(labels.slice(index, index + labelsPerPage));
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-slate-100 px-4 pb-20 pt-6 md:px-8">
      <style jsx global>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            gap: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 10mm !important;
            page-break-after: always !important;
            border: none !important;
            width: 210mm !important;
            height: 297mm !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="no-print rounded-full bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-xl">
        Vista de impresion A4
      </div>

      <div className="print-container flex flex-col gap-10">
        {pages.map((pageLabels, pageIndex) => (
          <div
            key={pageIndex}
            className="print-page bg-white shadow-2xl"
            style={{
              width: "210mm",
              height: "297mm",
              padding: "10mm",
              display: "grid",
              gridTemplateColumns: "1fr",
              gridTemplateRows: "repeat(3, 1fr)",
              gap: "8mm",
              boxSizing: "border-box",
              position: "relative",
              transform:
                typeof window !== "undefined" && window.innerWidth < 1000
                  ? `scale(${window.innerWidth / 900})`
                  : "none",
              transformOrigin: "top center",
            }}
          >
            {pageLabels.map((label, labelIndex) => (
              <RefinedLabelCard
                key={`${label.id}-${labelIndex}`}
                label={label}
                qrDataUrl={qrCodes[label.id]}
                logoUrl={logoUrl}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RefinedLabelCard({
  label,
  qrDataUrl,
  logoUrl,
}: {
  label: LabelData;
  qrDataUrl?: string;
  logoUrl?: string | null;
}) {
  const shortId = label.id?.slice(-6).toUpperCase() || "N/A";
  const clientName = normalizeText(label.client_name_cache || "Cliente").toUpperCase();
  const recipient = label.clients?.contact_name
    ? normalizeText(label.clients.contact_name)
    : null;
  const address = normalizeText(label.clients?.address || "Sin direccion registrada");
  const deliveryWindow = label.clients?.delivery_window
    ? normalizeText(label.clients.delivery_window)
    : null;
  const notes = label.notes ? normalizeText(label.notes) : null;
  const contactLine = buildContactLine(label.clients);
  const date = new Date(label.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      style={{
        border: "2px solid #0f172a",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.07)",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          color: "#ffffff",
          padding: "5mm 6mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          gap: "4mm",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3mm",
            minWidth: 0,
            flex: 1,
          }}
        >
          {logoUrl ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "999px",
                padding: "1.5mm 3mm",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "24mm",
                maxWidth: "34mm",
                height: "10mm",
                flexShrink: 0,
              }}
            >
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <span style={{ fontSize: "11pt", flexShrink: 0 }}>Mr. Blonde</span>
          )}

          <span
            style={{
              fontSize: "10pt",
              opacity: 0.95,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Rotulo de entrega
          </span>
        </div>

        <span style={{ fontSize: "10pt", opacity: 0.9, flexShrink: 0 }}>
          Pedido #{shortId}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 58mm",
          gap: "6mm",
          padding: "6mm",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "2mm 4mm",
              borderRadius: "999px",
              background: "#e2e8f0",
              color: "#0f172a",
              fontSize: "8pt",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Destinatario
          </div>

          <div
            style={{
              marginTop: "3mm",
              fontSize: "18pt",
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#0f172a",
              textTransform: "uppercase",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {clientName}
          </div>

          {recipient && (
            <div
              style={{
                marginTop: "2mm",
                fontSize: "9pt",
                color: "#475569",
                fontWeight: 600,
              }}
            >
              Recibe: {recipient}
            </div>
          )}

          <InfoCard title="Direccion de entrega" style={{ marginTop: "4mm" }}>
            <div
              style={{
                fontSize: "12pt",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {address}
            </div>
          </InfoCard>

          {deliveryWindow && (
            <InfoCard title="Ventana de entrega" tone="slate" style={{ marginTop: "3mm" }}>
              <div
                style={{
                  fontSize: "10.5pt",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {deliveryWindow}
              </div>
            </InfoCard>
          )}

          {notes && (
            <InfoCard title="Indicaciones" tone="amber" style={{ marginTop: "3mm" }}>
              <div
                style={{
                  fontSize: "10pt",
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: "#0f172a",
                  lineHeight: 1.25,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {notes}
              </div>
            </InfoCard>
          )}
        </div>

        <div
          style={{
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "#f1f5f9",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "5mm 4mm",
            gap: "4mm",
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR"
              style={{
                width: "42mm",
                height: "42mm",
                display: "block",
                background: "#ffffff",
                padding: "2mm",
                borderRadius: "6px",
              }}
            />
          ) : (
            <div
              style={{
                width: "42mm",
                height: "42mm",
                background: "#e2e8f0",
                borderRadius: "6px",
              }}
            />
          )}

          <div
            style={{
              fontSize: "8pt",
              fontWeight: 800,
              color: "#475569",
              textTransform: "uppercase",
              textAlign: "center",
              letterSpacing: "0.08em",
              lineHeight: 1.2,
            }}
          >
            Escanear para confirmar entrega
          </div>

          <div
            style={{
              width: "100%",
              borderRadius: "8px",
              background: "#0f172a",
              color: "#ffffff",
              padding: "3mm",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "7pt",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: 0.85,
              }}
            >
              Bulto
            </div>
            <div style={{ fontSize: "17pt", fontWeight: 900, lineHeight: 1.1 }}>
              {label.bundleIdx}/{label.totalBundles}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #cbd5e1",
          padding: "3.5mm 6mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "6mm",
          fontSize: "8.5pt",
          color: "#64748b",
          background: "#ffffff",
        }}
      >
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {contactLine}
        </span>
        <span style={{ flexShrink: 0 }}>Emitido {date}</span>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
  tone = "default",
  style,
}: {
  title: string;
  children: ReactNode;
  tone?: "default" | "slate" | "amber";
  style?: CSSProperties;
}) {
  const palette =
    tone === "amber"
      ? { background: "#fff7ed", border: "#fbbf24" }
      : tone === "slate"
        ? { background: "#e2e8f0", border: "#cbd5e1" }
        : { background: "#f8fafc", border: "#cbd5e1" };

  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        background: palette.background,
        borderRadius: "8px",
        padding: "3mm",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: "7.5pt",
          fontWeight: 800,
          color: "#475569",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "1.5mm",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildContactLine(clients: LabelData["clients"]): string {
  const parts = [
    clients?.phone ? `Tel: ${normalizeText(clients.phone)}` : null,
    clients?.email ? normalizeText(clients.email) : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Sin datos de contacto";
}
