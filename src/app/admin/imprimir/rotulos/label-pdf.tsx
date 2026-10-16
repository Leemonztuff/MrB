'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { LabelData, LabelFormat } from '@/types';
import { formatDate } from '@/lib/formatters';

// Tipografia de marca (Century Gothic) para el PDF.
// Los archivos se sirven desde /public/fonts para que react-pdf los pueda embeber.
Font.register({
  family: 'CenturyGothic',
  fonts: [
    { src: '/fonts/CenturyGothicPaneuropeanRegular.ttf', fontWeight: 'normal' },
    { src: '/fonts/CenturyGothicPaneuropeanBold.ttf', fontWeight: 'bold' },
    { src: '/fonts/CenturyGothicPaneuropeanBlack.ttf', fontWeight: 900 },
  ],
});

const BRAND_GOLD = '#C5A45E';
const DARK = '#111111';
const GRAY = '#5F5F5F';
const LIGHT = '#9A9A9A';
const BADGE_TEXT = '#E6D5A7';

const A4_HEIGHT = 842;

// Escala el rotulo segun cuantos entran por hoja, para que cada formato se vea intencional.
function sizes(perPage: number) {
  if (perPage <= 1) {
    return { qr: 190, right: 210, name: 26, address: 22, addressLabel: 11, wordmark: 30, pill: 12, note: 13, id: 11, qrText: 10, badge: 15, badgePad: '8 18', gap: 26, pad: 40 };
  }
  if (perPage === 2) {
    return { qr: 130, right: 160, name: 20, address: 17, addressLabel: 9.5, wordmark: 24, pill: 10, note: 11, id: 9, qrText: 9, badge: 12, badgePad: '6 14', gap: 20, pad: 30 };
  }
  return { qr: 108, right: 140, name: 16, address: 13.5, addressLabel: 8.5, wordmark: 20, pill: 9, note: 9.5, id: 8, qrText: 8, badge: 10.5, badgePad: '5 12', gap: 16, pad: 24 };
}

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    fontFamily: 'CenturyGothic',
  },
  row: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderLeft: `5px solid ${BRAND_GOLD}`,
  },
  rowBorder: {
    borderBottom: '1px dashed #E3E3E3',
  },
  left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    objectFit: 'contain',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  wordmark: {
    fontFamily: 'CenturyGothic',
    fontWeight: 900,
    color: DARK,
    letterSpacing: 1,
  },
  rule: {
    height: 3,
    backgroundColor: BRAND_GOLD,
    marginBottom: 5,
  },
  clientName: {
    fontFamily: 'CenturyGothic',
    fontWeight: 'bold',
    color: DARK,
  },
  addressBlock: {
    borderLeft: `3px solid ${BRAND_GOLD}`,
    paddingLeft: 10,
    marginTop: 2,
  },
  addressLabel: {
    fontFamily: 'CenturyGothic',
    fontWeight: 'bold',
    color: BRAND_GOLD,
    letterSpacing: 1.5,
    marginBottom: 1,
  },
  address: {
    fontFamily: 'CenturyGothic',
    fontWeight: 'bold',
    color: DARK,
    lineHeight: 1.25,
  },
  addressMissing: {
    fontFamily: 'CenturyGothic',
    fontWeight: 'bold',
    color: '#B00020',
    lineHeight: 1.25,
  },
  pill: {
    fontFamily: 'CenturyGothic',
    fontWeight: 'bold',
    color: DARK,
    backgroundColor: '#F2E9D0',
    padding: '4px 8px',
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  notes: {
    color: GRAY,
    fontStyle: 'italic',
    padding: '4px 8px',
    backgroundColor: '#FFF7E0',
    borderLeft: `2px solid ${BRAND_GOLD}`,
    marginTop: 3,
  },
  id: {
    color: LIGHT,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid #ECECEC',
    paddingLeft: 16,
  },
  qrText: {
    fontFamily: 'CenturyGothic',
    fontWeight: 'bold',
    color: GRAY,
    letterSpacing: 1,
    marginTop: 6,
    textAlign: 'center',
  },
  bundleBadge: {
    backgroundColor: DARK,
    marginTop: 6,
    textAlign: 'center',
  },
});

function SingleLabel({
  label,
  logoUrl,
  perPage,
  isLast,
}: {
  label: LabelData;
  logoUrl?: string | null;
  perPage: number;
  isLast: boolean;
}) {
  const s = sizes(perPage);
  const shortId = label.id?.slice(-6).toUpperCase() ?? '';
  const height = Math.floor(A4_HEIGHT / perPage);

  return (
    <View
      style={[
        styles.row,
        { height, paddingHorizontal: s.pad, gap: s.gap },
        isLast ? {} : styles.rowBorder,
      ]}
    >
      <View style={[styles.left, { gap: s.gap * 0.3 }]}>
        {logoUrl ? (
          <Image src={logoUrl} style={[styles.logo, { height: s.wordmark * 1.5 }]} />
        ) : (
          <Text style={[styles.wordmark, { fontSize: s.wordmark }]}>MR. BLONDE</Text>
        )}
        <View style={[styles.rule, { width: Math.round(s.wordmark * 1.7) }]} />
        <Text style={[styles.clientName, { fontSize: s.name }]}>
          {label.client_name_cache || 'Cliente'}
        </Text>
        <View style={styles.addressBlock}>
          <Text style={[styles.addressLabel, { fontSize: s.addressLabel }]}>
            DIRECCIÓN DE ENTREGA
          </Text>
          {label.clients?.address ? (
            <Text style={[styles.address, { fontSize: s.address }]}>
              {label.clients.address}
            </Text>
          ) : (
            <Text style={[styles.addressMissing, { fontSize: s.address }]}>
              SIN DIRECCIÓN CARGADA
            </Text>
          )}
        </View>
        {label.clients?.delivery_window ? (
          <Text style={[styles.pill, { fontSize: s.pill }]}>
            Entrega: {label.clients.delivery_window}
          </Text>
        ) : null}
        {label.notes ? (
          <Text style={[styles.notes, { fontSize: s.note }]}>Nota: {label.notes}</Text>
        ) : null}
        <Text style={[styles.id, { fontSize: s.id }]}>
          PEDIDO #{shortId} · {formatDate(label.created_at)}
        </Text>
      </View>

      <View style={[styles.right, { width: s.right }]}>
        {label._qrDataUrl ? (
          <Image src={label._qrDataUrl} style={{ width: s.qr, height: s.qr }} />
        ) : null}
        <Text style={[styles.qrText, { fontSize: s.qrText }]}>SCAN PARA CONFORMAR</Text>
        <View style={[styles.bundleBadge, { padding: s.badgePad }]}>
          <Text style={{ color: BADGE_TEXT, fontSize: s.badge }}>
            BULTO {label.bundleIdx} DE {label.totalBundles}
          </Text>
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
                perPage={perPage}
                isLast={idx === pageLabels.length - 1}
              />
            ))}
          </Page>
        );
      })}
    </Document>
  );
}
