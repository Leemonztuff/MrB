import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';

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

interface FormattedLabel {
  id: string;
  shortId: string;
  clientName: string;
  recipientName: string | null;
  address: string;
  deliveryWindow: string | null;
  notes: string | null;
  contactLine: string;
  bundleText: string;
  dateText: string;
  scanText: string;
  qrDataUrl: string;
}

interface PreparedLogoAsset {
  dataUrl: string;
  format: 'PNG' | 'JPEG' | 'WEBP';
}

interface LabelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  contentX: number;
  contentY: number;
  qrSize: number;
}

const THEME = {
  colors: {
    border: [15, 23, 42] as [number, number, number],
    headerBg: [15, 23, 42] as [number, number, number],
    headerText: [255, 255, 255] as [number, number, number],
    panelBg: [248, 250, 252] as [number, number, number],
    panelBorder: [203, 213, 225] as [number, number, number],
    chipBg: [226, 232, 240] as [number, number, number],
    chipText: [15, 23, 42] as [number, number, number],
    primaryText: [15, 23, 42] as [number, number, number],
    secondaryText: [71, 85, 105] as [number, number, number],
    mutedText: [100, 116, 139] as [number, number, number],
    noteBg: [255, 247, 237] as [number, number, number],
    noteBorder: [251, 191, 36] as [number, number, number],
    qrPanelBg: [241, 245, 249] as [number, number, number],
  },
  spacing: {
    margin: 5,
    padding: 5,
    gap: 4,
    headerHeight: 14,
    footerHeight: 10,
  },
  fonts: {
    title: 17,
    header: 13,
    body: 10,
    small: 8,
  },
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export async function generateLabelsPDF(
  labels: LabelData[],
  logoUrl: string | null,
  baseUrl: string
): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const labelsPerPage = 3;
  const labelHeight = (pageHeight - THEME.spacing.margin * 2 - THEME.spacing.gap * (labelsPerPage - 1)) / labelsPerPage;
  const labelWidth = pageWidth - THEME.spacing.margin * 2;

  const [formattedLabels, logoAsset] = await Promise.all([
    Promise.all(labels.map(label => formatLabelData(label, baseUrl))),
    prepareLogoAsset(logoUrl),
  ]);

  for (let index = 0; index < formattedLabels.length; index += 1) {
    if (index > 0 && index % labelsPerPage === 0) {
      doc.addPage('portrait');
    }

    const labelIndex = index % labelsPerPage;
    const layout = getLabelLayout(
      THEME.spacing.margin,
      THEME.spacing.margin + labelIndex * (labelHeight + THEME.spacing.gap),
      labelWidth,
      labelHeight
    );

    renderLabel(doc, formattedLabels[index], layout, logoAsset);
  }

  return new Uint8Array(doc.output('arraybuffer'));
}

async function formatLabelData(label: LabelData, baseUrl: string): Promise<FormattedLabel> {
  const confirmUrl = `${baseUrl}/pedido/confirmar/${label.id}`;
  const qrDataUrl = await QRCode.toDataURL(confirmUrl, {
    margin: 2,
    width: 1200,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const recipientName = label.clients?.contact_name ? truncateText(normalizeText(label.clients.contact_name), 30) : null;
  const deliveryWindow = label.clients?.delivery_window ? normalizeText(label.clients.delivery_window) : null;
  const notes = label.notes ? truncateText(normalizeText(label.notes), 100) : null;

  return {
    id: label.id,
    shortId: label.id.slice(-6).toUpperCase(),
    clientName: normalizeText(label.client_name_cache || 'Cliente').toUpperCase(),
    recipientName,
    address: truncateText(normalizeText(label.clients?.address || 'Sin direccion registrada'), 80),
    deliveryWindow,
    notes,
    contactLine: buildCompactContactLine(label.clients),
    bundleText: `${label.bundleIdx}/${label.totalBundles}`,
    dateText: DATE_FORMATTER.format(new Date(label.created_at)),
    scanText: 'Escanear para confirmar entrega',
    qrDataUrl,
  };
}

function getLabelLayout(x: number, y: number, width: number, height: number): LabelLayout {
  return {
    x,
    y,
    width,
    height,
    contentX: x + THEME.spacing.padding,
    contentY: y + THEME.spacing.headerHeight + THEME.spacing.padding,
    qrSize: 42,
  };
}

function renderLabel(doc: jsPDF, data: FormattedLabel, layout: LabelLayout, logoAsset: PreparedLogoAsset | null) {
  const { x, y, width, height, contentX, contentY, qrSize } = layout;
  const rightPanelWidth = qrSize + 12;
  const leftWidth = width - rightPanelWidth - THEME.spacing.padding * 3;
  const rightPanelX = x + width - rightPanelWidth - THEME.spacing.padding;
  const qrX = rightPanelX + (rightPanelWidth - qrSize) / 2;
  const qrY = y + THEME.spacing.headerHeight + 12;

  const hasRecipient = !!data.recipientName;
  const hasDeliveryWindow = !!data.deliveryWindow;
  const hasNotes = !!data.notes;
  const fieldCount = [hasRecipient, hasDeliveryWindow, hasNotes].filter(Boolean).length;
  const isCompact = fieldCount >= 2;
  
  const nameFontSize = data.clientName.length > 20 
    ? (isCompact ? 13 : 15) 
    : (isCompact ? 14 : 17);
  const addressFontSize = isCompact ? 9 : 10;
  const infoBlockFontSize = isCompact ? 8 : 9;
  const titleFontSize = isCompact ? 6.5 : 7.5;

  doc.setDrawColor(...THEME.colors.border);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, width, height, 1, 1);

  doc.setFillColor(...THEME.colors.headerBg);
  doc.rect(x, y, width, THEME.spacing.headerHeight, 'F');
  doc.setTextColor(...THEME.colors.headerText);
  doc.setFont('helvetica', 'bold');

  let headerTextX = contentX;

  if (logoAsset) {
    const logoBoxX = contentX;
    const logoBoxY = y + 2.2;
    const logoBoxWidth = 28;
    const logoBoxHeight = 9.6;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 4.8, 4.8, 'F');
    doc.addImage(
      logoAsset.dataUrl,
      logoAsset.format,
      logoBoxX + 1.8,
      logoBoxY + 1.2,
      logoBoxWidth - 3.6,
      logoBoxHeight - 2.4,
      undefined,
      'FAST'
    );
    headerTextX = logoBoxX + logoBoxWidth + 3;
  } else {
    doc.setFontSize(THEME.fonts.header);
    doc.text('MR. BLONDE', contentX, y + 9.5);
    headerTextX = contentX + 29;
  }

  doc.setFontSize(11);
  doc.text('ROTULO DE ENTREGA', headerTextX, y + 9.5);
  doc.text(`Pedido #${data.shortId}`, x + width - THEME.spacing.padding, y + 9.5, { align: 'right' });

  doc.setFillColor(...THEME.colors.qrPanelBg);
  doc.setDrawColor(...THEME.colors.panelBorder);
  doc.roundedRect(rightPanelX, y + THEME.spacing.headerHeight + 4, rightPanelWidth, height - THEME.spacing.headerHeight - 8, 1, 1, 'FD');

  doc.addImage(data.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, data.id, 'NONE');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...THEME.colors.secondaryText);
  const scanLines = fitLines(doc, data.scanText.toUpperCase(), rightPanelWidth - 8, 2);
  doc.text(scanLines, rightPanelX + rightPanelWidth / 2, qrY + qrSize + 8, { align: 'center' });

  const bundleY = qrY + qrSize + 20;
  doc.setFillColor(...THEME.colors.headerBg);
  doc.roundedRect(rightPanelX + 4, bundleY, rightPanelWidth - 8, 14, 1.2, 1.2, 'F');
  doc.setTextColor(...THEME.colors.headerText);
  doc.setFontSize(7);
  doc.text('BULTO', rightPanelX + rightPanelWidth / 2, bundleY + 4.5, { align: 'center' });
  doc.setFontSize(15);
  doc.text(data.bundleText, rightPanelX + rightPanelWidth / 2, bundleY + 10.5, { align: 'center' });

  const chipWidth = Math.min(42, leftWidth);
  doc.setFillColor(...THEME.colors.chipBg);
  doc.roundedRect(contentX, contentY, chipWidth, 7, 1, 1, 'F');
  doc.setTextColor(...THEME.colors.chipText);
  doc.setFontSize(7.5);
  doc.text('DESTINATARIO', contentX + chipWidth / 2, contentY + 4.5, { align: 'center' });

  const nameY = contentY + 13;
  doc.setTextColor(...THEME.colors.primaryText);
  doc.setFontSize(nameFontSize);
  const clientLines = fitLines(doc, data.clientName, leftWidth, 2);
  doc.text(clientLines, contentX, nameY);

  let currentY = nameY + clientLines.length * (nameFontSize * 0.7) + 2;

  if (data.recipientName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isCompact ? 7 : 9);
    doc.setTextColor(...THEME.colors.secondaryText);
    doc.text(`Recibe: ${data.recipientName}`, contentX, currentY);
    currentY += isCompact ? 5 : 6;
  }

  currentY += drawAddressCard(doc, contentX, currentY, leftWidth, data.address, isCompact, addressFontSize, titleFontSize) + (isCompact ? 2 : 4);

  if (data.deliveryWindow) {
    currentY += drawInfoBlock(doc, {
      x: contentX,
      y: currentY,
      width: leftWidth,
      title: 'VENTANA DE ENTREGA',
      text: data.deliveryWindow,
      fillColor: THEME.colors.chipBg,
      borderColor: THEME.colors.panelBorder,
      fontStyle: 'bold',
      compact: isCompact,
      fontSize: infoBlockFontSize,
      titleSize: titleFontSize,
    }) + (isCompact ? 2 : 3);
  }

  if (data.notes) {
    currentY += drawInfoBlock(doc, {
      x: contentX,
      y: currentY,
      width: leftWidth,
      title: 'INDICACIONES',
      text: data.notes,
      fillColor: THEME.colors.noteBg,
      borderColor: THEME.colors.noteBorder,
      fontStyle: 'italic',
      compact: isCompact,
      fontSize: infoBlockFontSize,
      titleSize: titleFontSize,
    }) + (isCompact ? 2 : 3);
  }

  doc.setDrawColor(...THEME.colors.panelBorder);
  doc.setLineWidth(0.3);
  doc.line(contentX, y + height - THEME.spacing.footerHeight - 2, x + width - THEME.spacing.padding, y + height - THEME.spacing.footerHeight - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(THEME.fonts.small);
  doc.setTextColor(...THEME.colors.mutedText);
  doc.text(data.contactLine, contentX, y + height - 5.2);
  doc.text(`Emitido ${data.dateText}`, x + width - THEME.spacing.padding, y + height - 5.2, { align: 'right' });
}

function drawAddressCard(doc: jsPDF, x: number, y: number, width: number, address: string, isCompact = false, fontSize = 10, titleSize = 7.5): number {
  const height = isCompact ? 24 : 31;
  doc.setFillColor(...THEME.colors.panelBg);
  doc.setDrawColor(...THEME.colors.panelBorder);
  doc.roundedRect(x, y, width, height, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleSize);
  doc.setTextColor(...THEME.colors.secondaryText);
  doc.text('DIRECCION DE ENTREGA', x + 3, y + (isCompact ? 4.5 : 5));

  doc.setFontSize(fontSize);
  doc.setTextColor(...THEME.colors.primaryText);
  const lines = fitLines(doc, address, width - 6, isCompact ? 2 : 3);
  doc.text(lines, x + 3, y + (isCompact ? 10 : 11));

  return height;
}

function drawInfoBlock(
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    title: string;
    text: string;
    fillColor: [number, number, number];
    borderColor: [number, number, number];
    fontStyle: 'bold' | 'italic' | 'normal';
    compact?: boolean;
    fontSize?: number;
    titleSize?: number;
  }
): number {
  const { x, y, width, title, text, fillColor, borderColor, fontStyle, compact = false, fontSize = THEME.fonts.body, titleSize = 7.5 } = options;
  const padding = compact ? 2 : 3;

  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(fontSize);
  const lines = fitLines(doc, text, width - padding * 2, compact ? 2 : 3);
  const lineHeight = compact ? 4 : 4.5;
  const height = (compact ? 9 : 11) + lines.length * lineHeight;

  doc.setFillColor(...fillColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(x, y, width, height, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleSize);
  doc.setTextColor(...THEME.colors.secondaryText);
  doc.text(title, x + padding, y + (compact ? 4 : 4.5));

  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(...THEME.colors.primaryText);
  doc.text(lines, x + padding, y + (compact ? 8.5 : 10));

  return height;
}

function fitLines(doc: jsPDF, text: string, width: number, maxLines: number): string[] {
  const lines = doc.splitTextToSize(normalizeText(text), width) as string[];
  if (lines.length <= maxLines) return lines;

  const trimmed = lines.slice(0, maxLines);
  trimmed[maxLines - 1] = truncateWithEllipsis(doc, trimmed[maxLines - 1], width);
  return trimmed;
}

function truncateWithEllipsis(doc: jsPDF, text: string, width: number): string {
  let candidate = text.trim();
  while (candidate.length > 0 && doc.getTextWidth(`${candidate}...`) > width) {
    candidate = candidate.slice(0, -1).trimEnd();
  }

  return `${candidate}...`;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 3) + '...';
}

function buildContactLine(clients: LabelData['clients']): string {
  const parts = [
    clients?.phone ? `Tel: ${normalizeText(clients.phone)}` : null,
    clients?.email ? normalizeText(clients.email) : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : 'Sin datos de contacto';
}

function buildCompactContactLine(clients: LabelData['clients']): string {
  const phone = clients?.phone ? normalizeText(clients.phone) : null;
  const email = clients?.email ? normalizeText(clients.email) : null;
  
  if (phone && email) {
    return `${phone} | ${truncateText(email, 25)}`;
  }
  
  if (phone) return `Tel: ${phone}`;
  if (email) return truncateText(email, 40);
  
  return 'Sin datos de contacto';
}

async function prepareLogoAsset(logoUrl: string | null): Promise<PreparedLogoAsset | null> {
  if (!logoUrl) return null;

  try {
    const response = await fetch(logoUrl, { cache: 'no-store' });
    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const format = getImageFormat(contentType, logoUrl);
    if (!format) return null;

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      dataUrl: `data:${contentType || `image/${format.toLowerCase()}`};base64,${base64}`,
      format,
    };
  } catch (error) {
    console.error('Logo asset error:', error);
    return null;
  }
}

function getImageFormat(
  contentType: string,
  logoUrl: string
): PreparedLogoAsset['format'] | null {
  if (contentType.includes('png')) return 'PNG';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'JPEG';
  if (contentType.includes('webp')) return 'WEBP';

  const lowerUrl = logoUrl.toLowerCase();
  if (lowerUrl.includes('.png')) return 'PNG';
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'JPEG';
  if (lowerUrl.includes('.webp')) return 'WEBP';

  return null;
}
