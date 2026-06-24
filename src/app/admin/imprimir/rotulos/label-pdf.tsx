'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { LabelData, LabelFormat } from '@/types';

const GOLD = '#E6D5A7';
const DARK = '#111111';
const GRAY = '#666666';
const LIGHT_GRAY = '#999999';

const styles = StyleSheet.create({
  page: {
    padding: 10,
    size: 'A4',
  },
  labelCompact: {
    width: '100%',
    borderBottom: '1px dashed #ccc',
    padding: '15 0',
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },
  labelCompactLast: {
    width: '100%',
    padding: '15 0',
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },
  labelFull: {
    width: '100%',
    height: '100%',
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: 25,
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
  },
  left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
  },
  right: {
    width: 140,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid #eee',
    paddingLeft: 12,
    gap: 8,
  },
  brand: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: GRAY,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  deliveryWindow: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    backgroundColor: '#f0f0f0',
    padding: '4 8',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  notes: {
    fontSize: 10,
    color: GRAY,
    fontStyle: 'italic',
    marginTop: 4,
    padding: '4 8',
    backgroundColor: '#fff8e1',
    borderLeft: '2px solid #ffc107',
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GRAY,
  },
  bundleBadge: {
    backgroundColor: DARK,
    color: GOLD,
    padding: '5 12',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    width: '100%',
    textAlign: 'center',
  },
  logoImage: {
    width: 28,
    height: 28,
    marginBottom: 6,
  },
});

function SingleLabel({ label, logoUrl, isLast }: { label: LabelData; logoUrl?: string | null; isLast?: boolean }) {
  const shortId = label.id?.slice(-6).toUpperCase() ?? '';

  return (
    <View style={isLast ? styles.labelCompactLast : styles.labelCompact} wrap={false}>
      <View style={styles.left}>
        {logoUrl ? (
          <Image src={logoUrl} style={styles.logoImage} />
        ) : (
          <Text style={styles.brand}>MR. BLONDE</Text>
        )}
        <Text style={styles.clientName}>{label.client_name_cache || 'Cliente'}</Text>
        <Text style={styles.address}>{label.clients?.address || 'Direccion no registrada'}</Text>
        {label.clients?.delivery_window && (
          <Text style={styles.deliveryWindow}>Horario: {label.clients.delivery_window}</Text>
        )}
        {label.notes && (
          <Text style={styles.notes}>Nota: {label.notes}</Text>
        )}
        <Text style={{ fontSize: 8, color: LIGHT_GRAY, marginTop: 6 }}>#{shortId}</Text>
      </View>
      <View style={styles.right}>
        {label._qrDataUrl && (
          <Image src={label._qrDataUrl} style={styles.qrImage} />
        )}
        <Text style={styles.qrText}>SCAN PARA CONFORMAR</Text>
        <View style={styles.bundleBadge}>
          <Text style={{ color: GOLD }}>BULTO {label.bundleIdx} DE {label.totalBundles}</Text>
        </View>
      </View>
    </View>
  );
}

export function LabelDocument({
  labels,
  format,
  logoUrl,
}: {
  labels: LabelData[];
  format: LabelFormat;
  logoUrl?: string | null;
}) {
  const perPage = format;
  const pages = Math.ceil(labels.length / perPage);

  return (
    <Document>
      {Array.from({ length: pages }).map((_, pageIdx) => {
        const pageLabels = labels.slice(pageIdx * perPage, pageIdx * perPage + perPage);
        return (
          <Page key={pageIdx} size="A4" style={styles.page}>
            {pageLabels.map((label, idx) => (
              <SingleLabel
                key={`${label.id}-${label.bundleIdx}`}
                label={label}
                logoUrl={logoUrl}
                isLast={idx === pageLabels.length - 1}
              />
            ))}
          </Page>
        );
      })}
    </Document>
  );
}
