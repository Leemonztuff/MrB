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
  labelFull: {
    width: '100%',
    height: '100%',
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: 20,
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },
  labelCompact: {
    width: '100%',
    borderBottom: '1px dashed #ccc',
    padding: '12 0',
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },
  labelCompactLast: {
    width: '100%',
    padding: '12 0',
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },
  left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
  },
  right: {
    width: 140,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid #eee',
    paddingLeft: 12,
    gap: 6,
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 2,
  },
  address: {
    fontSize: 10,
    color: GRAY,
    marginBottom: 4,
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    fontSize: 8,
    color: LIGHT_GRAY,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'row',
    gap: 3,
  },
  qrImage: {
    width: 90,
    height: 90,
  },
  qrText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY,
  },
  bundleBadge: {
    backgroundColor: DARK,
    color: GOLD,
    padding: '4 10',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: '100%',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: LIGHT_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 3,
  },
  itemRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: DARK,
    marginBottom: 1,
  },
  itemName: {
    flex: 1,
  },
  itemQty: {
    width: 30,
    textAlign: 'right',
  },
  totalRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 4,
    paddingTop: 4,
    borderTop: '1px solid #eee',
  },
  notes: {
    fontSize: 8,
    color: GRAY,
    fontStyle: 'italic',
    marginTop: 4,
  },
  logoImage: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function SingleLabel({ label, logoUrl, isLast }: { label: LabelData; logoUrl?: string | null; isLast?: boolean }) {
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pedido/confirmar/${label.id}`;
  const shortId = label.id?.slice(-6).toUpperCase() ?? '';
  const itemCount = label.order_items?.length ?? 0;

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
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>Pedido #{shortId}</Text>
          <Text style={styles.metaItem}>|</Text>
          <Text style={styles.metaItem}>{formatDate(label.created_at)}</Text>
          {label.clients?.delivery_window && (
            <>
              <Text style={styles.metaItem}>|</Text>
              <Text style={styles.metaItem}>{label.clients.delivery_window}</Text>
            </>
          )}
        </View>
        {itemCount > 0 && (
          <>
            <Text style={styles.sectionTitle}>Resumen ({itemCount} productos)</Text>
            {label.order_items?.slice(0, 5).map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.products?.name || 'Producto'}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
            ))}
            {itemCount > 5 && (
              <Text style={{ fontSize: 7, color: LIGHT_GRAY }}>+{itemCount - 5} mas...</Text>
            )}
            <View style={styles.totalRow}>
              <Text>Total</Text>
              <Text>${label.total_amount.toLocaleString('es-AR')}</Text>
            </View>
          </>
        )}
        {label.notes && (
          <Text style={styles.notes}>Nota: {label.notes}</Text>
        )}
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
