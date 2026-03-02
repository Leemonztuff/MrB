import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
    padding: 5,
  },
  labelContainer: {
    width: '50%',
    height: '50%',
    padding: 3,
    boxSizing: 'border-box',
  },
  label: {
    border: '1pt solid #000000',
    borderRadius: 4,
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#1a1a1a',
    color: '#E6D5A7',
    padding: '6pt 8pt',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  logo: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1,
  },
  orderId: {
    fontSize: 9,
    fontWeight: 700,
    color: '#E6D5A7',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    padding: 6,
    gap: 4,
    minHeight: 0,
  },
  mainSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  clientName: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#000000',
    lineHeight: 1.2,
  },
  addressRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
  },
  addressIcon: {
    fontSize: 7,
  },
  addressText: {
    fontSize: 9,
    fontWeight: 600,
    color: '#000000',
    lineHeight: 1.3,
    flex: 1,
  },
  deliveryRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    padding: '2pt 4pt',
    borderRadius: 2,
    borderLeft: '2pt solid #f59e0b',
  },
  deliveryIcon: {
    fontSize: 7,
  },
  deliveryText: {
    fontSize: 8,
    fontWeight: 600,
    color: '#000000',
  },
  notesRow: {
    backgroundColor: '#fef3c7',
    padding: '3pt 5pt',
    borderRadius: 2,
    borderLeft: '2pt solid #f59e0b',
    marginTop: 'auto',
  },
  notesText: {
    fontSize: 7,
    color: '#000000',
    fontStyle: 'italic',
    lineHeight: 1.3,
  },
  contactRow: {
    fontSize: 7,
    color: '#666666',
    marginTop: 'auto',
    paddingTop: 3,
    borderTop: '0.5pt dashed #dddddd',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  qrImage: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  bundleBadge: {
    backgroundColor: '#000000',
    color: '#E6D5A7',
    padding: '2pt 6pt',
    fontSize: 9,
    fontWeight: 900,
    borderRadius: 2,
    textTransform: 'uppercase',
  },
  footer: {
    backgroundColor: '#f5f5f5',
    padding: '2pt 8pt',
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  date: {
    fontSize: 7,
    color: '#666666',
  },
});

export interface LabelData {
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

interface LabelPDFProps {
  labels: LabelData[];
  logoUrl?: string | null;
  baseUrl: string;
}

export function LabelPDF({ labels, logoUrl, baseUrl }: LabelPDFProps) {
  const labelsPerPage = 4;
  const pages: LabelData[][] = [];
  
  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage));
  }

  return (
    <Document>
      {pages.map((pageLabels, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {pageLabels.map((label, labelIndex) => {
            const shortId = label.id?.slice(-6).toUpperCase() || 'N/A';
            const date = new Date(label.created_at).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit'
            });

            return (
              <View key={`${label.id}-${labelIndex}`} style={styles.labelContainer}>
                <View style={styles.header}>
                  <Text style={styles.logo}>
                    {logoUrl ? 'MR. BLONDE' : 'MR. BLONDE'}
                  </Text>
                  <Text style={styles.orderId}>#{shortId}</Text>
                </View>
                
                <View style={styles.content}>
                  <View style={styles.mainSection}>
                    <Text style={styles.clientName}>
                      {label.client_name_cache || 'Cliente'}
                    </Text>
                    
                    <View style={styles.addressRow}>
                      <Text style={styles.addressIcon}>📍</Text>
                      <Text style={styles.addressText}>
                        {label.clients?.address || 'Sin dirección'}
                      </Text>
                    </View>
                    
                    {label.clients?.delivery_window && (
                      <View style={styles.deliveryRow}>
                        <Text style={styles.deliveryIcon}>📅</Text>
                        <Text style={styles.deliveryText}>
                          {label.clients.delivery_window}
                        </Text>
                      </View>
                    )}
                    
                    {label.notes && (
                      <View style={styles.notesRow}>
                        <Text style={styles.notesText}>📝 {label.notes}</Text>
                      </View>
                    )}
                    
                    <Text style={styles.contactRow}>
                      {label.clients?.phone || label.clients?.email || 'Sin contacto'}
                    </Text>
                  </View>
                  
                  <View style={styles.qrSection}>
                    <Image
                      style={styles.qrImage}
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${baseUrl}/api/pedido/confirmar/${label.id}`)}`}
                    />
                    <Text style={styles.bundleBadge}>
                      {label.bundleIdx}/{label.totalBundles}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.footer}>
                  <Text style={styles.date}>{date}</Text>
                </View>
              </View>
            );
          })}
        </Page>
      ))}
    </Document>
  );
}
