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
    contentY: y + THEME.spacing.headerHeight + 3,
    qrSize: 34,
  };
}

function renderLabel(doc: jsPDF, data: FormattedLabel, layout: LabelLayout, logoAsset: PreparedLogoAsset | null) {
  const { x, y, width, height, contentX, contentY, qrSize } = layout;
  const rightPanelWidth = qrSize + 10;
  const leftWidth = width - rightPanelWidth - THEME.spacing.padding * 3;
  const rightPanelX = x + width - rightPanelWidth - THEME.spacing.padding;
  const qrX = rightPanelX + (rightPanelWidth - qrSize) / 2;
  const qrY = y + THEME.spacing.headerHeight + 5;

  const hasDeliveryWindow = !!data.deliveryWindow;
  const hasNotes = !!data.notes;
  const isCompact = hasDeliveryWindow && hasNotes;
  
  const nameFontSize = data.clientName.length > 20 ? 13 : 15;

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

  // Right Panel specific rendering
  doc.setFillColor(...THEME.colors.qrPanelBg);
  doc.setDrawColor(...THEME.colors.panelBorder);
  doc.roundedRect(rightPanelX, y + THEME.spacing.headerHeight + 4, rightPanelWidth, height - THEME.spacing.headerHeight - 8, 1, 1, 'FD');

  doc.addImage(data.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, data.id, 'NONE');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...THEME.colors.secondaryText);
  const scanLines = fitLines(doc, data.scanText.toUpperCase(), rightPanelWidth - 6, 2);
  doc.text(scanLines, rightPanelX + rightPanelWidth / 2, qrY + qrSize + 5, { align: 'center' });

  const bundleY = qrY + qrSize + 5 + (scanLines.length * 3.5);
  doc.setFillColor(...THEME.colors.headerBg);
  doc.roundedRect(rightPanelX + 4, bundleY, rightPanelWidth - 8, 14, 1.2, 1.2, 'F');
  doc.setTextColor(...THEME.colors.headerText);
  doc.setFontSize(6.5);
  doc.text('BULTO', rightPanelX + rightPanelWidth / 2, bundleY + 4.5, { align: 'center' });
  doc.setFontSize(14);
  doc.text(data.bundleText, rightPanelX + rightPanelWidth / 2, bundleY + 10.5, { align: 'center' });

  // Left panel rendering
  const chipWidth = Math.min(38, leftWidth);
  doc.setFillColor(...THEME.colors.chipBg);
  doc.roundedRect(contentX, contentY, chipWidth, 6, 1, 1, 'F');
  doc.setTextColor(...THEME.colors.chipText);
  doc.setFontSize(7);
  doc.text('DESTINATARIO', contentX + chipWidth / 2, contentY + 4, { align: 'center' });

  const nameY = contentY + 11;
  doc.setTextColor(...THEME.colors.primaryText);
  doc.setFontSize(nameFontSize);
  const clientLines = fitLines(doc, data.clientName, leftWidth, 2);
  doc.text(clientLines, contentX, nameY);

  let currentY = nameY + clientLines.length * (nameFontSize * 0.35);

  if (data.recipientName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...THEME.colors.secondaryText);
    doc.text(`Recibe: ${data.recipientName}`, contentX, currentY);
    currentY += 4;
  }

  currentY += 1.5;

  const standardBlockHeight = 15;
  
  // Draw Address Block
  drawInfoBlockStandard(doc, {
    x: contentX,
    y: currentY,
    width: leftWidth,
    height: standardBlockHeight + 1,
    title: 'DIRECCION DE ENTREGA',
    text: data.address,
    fillColor: THEME.colors.panelBg,
    borderColor: THEME.colors.panelBorder,
    fontStyle: 'bold',
    maxLines: 2
  });
  
  currentY += standardBlockHeight + 3;

  // Draw Extras Block (Window and Notes side-by-side if both present)
  if (hasDeliveryWindow || hasNotes) {
    const both = hasDeliveryWindow && hasNotes;
    const blockWidth = both ? (leftWidth - 2) / 2 : leftWidth;
    
    let currentX = contentX;
    
    if (hasDeliveryWindow) {
      drawInfoBlockStandard(doc, {
        x: currentX,
        y: currentY,
        width: blockWidth,
        height: standardBlockHeight,
        title: 'VENTANA DE ENTREGA',
        text: data.deliveryWindow!,
        fillColor: THEME.colors.chipBg,
        borderColor: THEME.colors.panelBorder,
        fontStyle: 'bold',
        maxLines: 2
      });
      currentX += blockWidth + 2;
    }
    
    if (hasNotes) {
      drawInfoBlockStandard(doc, {
        x: currentX,
        y: currentY,
        width: blockWidth,
        height: standardBlockHeight,
        title: 'INDICACIONES',
        text: data.notes!,
        fillColor: THEME.colors.noteBg,
        borderColor: THEME.colors.noteBorder,
        fontStyle: 'italic',
        maxLines: 2
      });
    }
  }

  // Footer separator line
  doc.setDrawColor(...THEME.colors.panelBorder);
  doc.setLineWidth(0.3);
  doc.line(contentX, y + height - THEME.spacing.footerHeight - 2, x + width - THEME.spacing.padding, y + height - THEME.spacing.footerHeight - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(THEME.fonts.small);
  doc.setTextColor(...THEME.colors.mutedText);
  doc.text(data.contactLine, contentX, y + height - 5.2);
  doc.text(`Emitido ${data.dateText}`, x + width - THEME.spacing.padding, y + height - 5.2, { align: 'right' });
}

function drawInfoBlockStandard(
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    text: string;
    fillColor: [number, number, number];
    borderColor: [number, number, number];
    fontStyle: 'bold' | 'italic' | 'normal';
    maxLines: number;
  }
) {
  const { x, y, width, height, title, text, fillColor, borderColor, fontStyle, maxLines } = options;

  doc.setFillColor(...fillColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(x, y, width, height, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...THEME.colors.secondaryText);
  doc.text(title, x + 3, y + 4.5);

  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(8.5);
  doc.setTextColor(...THEME.colors.primaryText);
  const lines = fitLines(doc, text, width - 6, maxLines);
  doc.text(lines, x + 3, y + 9);
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
