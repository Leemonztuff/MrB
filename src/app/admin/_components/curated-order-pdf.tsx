'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { OrderWithItems } from '@/types';
import { aggregateOrderItems } from '@/lib/curated-order';
import '@/lib/pdf-fonts';

const GOLD = '#C5A45E';
const DARK = '#111111';
const GRAY = '#5F5F5F';

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    fontFamily: 'CenturyGothic',
    flexDirection: 'row',
    color: DARK,
  },
  order: {
    width: '50%',
    height: '100%',
    paddingVertical: 28,
    paddingHorizontal: 26,
    borderRight: '1px dashed #BDBDBD',
  },
  logo: {
    width: 170,
    height: 32,
    objectFit: 'contain',
    objectPosition: 'left',
    marginBottom: 14,
  },
  wordmark: {
    fontSize: 19,
    fontWeight: 900,
    letterSpacing: 1,
    marginBottom: 14,
  },
  heading: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderId: {
    color: GRAY,
    fontSize: 9,
    marginBottom: 3,
  },
  client: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  rule: {
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottom: '1px solid #BDBDBD',
    paddingBottom: 6,
    marginBottom: 3,
  },
  productHeader: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: GRAY,
    letterSpacing: 0.5,
  },
  quantityHeader: {
    width: 48,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 'bold',
    color: GRAY,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    borderBottom: '1px solid #E8E8E8',
    paddingVertical: 3,
  },
  product: {
    flex: 1,
    paddingRight: 6,
  },
  productName: {
    fontSize: 9,
    lineHeight: 1.2,
  },
  bonus: {
    color: GRAY,
    fontSize: 7,
    marginTop: 2,
  },
  quantity: {
    width: 48,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1px solid #555555',
    marginLeft: 7,
  },
});

function OrderSheet({ order, logoUrl }: { order: OrderWithItems; logoUrl: string | null }) {
  const lines = aggregateOrderItems(order.order_items);
  const rowHeight = lines.length > 20 ? 13 : 20;

  return (
    <View style={styles.order} wrap={false}>
      {logoUrl ? (
        <Image src={logoUrl} style={styles.logo} />
      ) : (
        <Text style={styles.wordmark}>MR. BLONDE</Text>
      )}
      <Text style={styles.heading}>ORDEN DE PREPARACIÓN</Text>
      <Text style={styles.orderId}>PEDIDO #{order.id.slice(-6).toUpperCase()}</Text>
      <Text style={styles.client}>{order.client_name_cache || 'Cliente'}</Text>
      <View style={styles.rule} />

      <View style={styles.tableHeader}>
        <Text style={styles.productHeader}>PRODUCTO</Text>
        <Text style={styles.quantityHeader}>CANT.</Text>
        <View style={[styles.checkbox, { borderColor: 'transparent' }]} />
      </View>

      {lines.map((line) => (
        <View key={line.id} style={[styles.line, { minHeight: rowHeight }]}>
          <View style={styles.product}>
            <Text style={styles.productName}>{line.name}</Text>
            {line.bonusQuantity > 0 ? (
              <Text style={styles.bonus}>{line.bonusQuantity} en promo incluidas</Text>
            ) : null}
          </View>
          <Text style={styles.quantity}>{line.quantity}</Text>
          <View style={styles.checkbox} />
        </View>
      ))}
    </View>
  );
}

export function CuratedOrderDocument({
  orders,
  logoUrl,
}: {
  orders: OrderWithItems[];
  logoUrl: string | null;
}) {
  const pageCount = Math.ceil(orders.length / 2);

  return (
    <Document>
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {orders.slice(pageIndex * 2, pageIndex * 2 + 2).map((order) => (
            <OrderSheet key={order.id} order={order} logoUrl={logoUrl} />
          ))}
        </Page>
      ))}
    </Document>
  );
}
