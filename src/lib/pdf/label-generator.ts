import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';

// --- Types & Interfaces ---

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
  address: string;
  deliveryWindow: string | null;
  notes: string | null;
  contact: string;
  bundleText: string;
  dateText: string;
  qrDataUrl: string;
}

interface LabelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  qrSize: number;
}

// --- Theme & Configuration ---

const THEME = {
  colors: {
    headerBg: [26, 26, 26] as [number, number, number],
    headerText: [230, 213, 167] as [number, number, number],
    primaryText: [0, 0, 0] as [number, number, number],
    secondaryText: [80, 80, 80] as [number, number, number],
    mutedText: [120, 120, 120] as [number, number, number],
    accentBg: [255, 251, 235] as [number, number, number],
    accentBorder: [245, 158, 11] as [number, number, number],
    footerBg: [245, 245, 245] as [number, number, number],
  },
  spacing: {
    margin: 5,
    padding: 5,
    gap: 3,
    headerHeight: 10,
    footerHeight: 6,
  },
  fonts: {
    title: 12,
    header: 10,
    body: 8,
    small: 6,
  }
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
});

// --- Orchestration ---

/**
 * Generates a PDF with labels for order bundles.
 * Optimized for A4 paper with 3 labels per page.
 */
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

  // Pre-format all labels (improves performance by doing heavy lifting outside the loop)
  const formattedLabels = await Promise.all(
    labels.map(label => formatLabelData(label, baseUrl))
  );

  for (let i = 0; i < formattedLabels.length; i++) {
    if (i > 0 && i % labelsPerPage === 0) {
      doc.addPage('portrait');
    }

    const labelIndex = i % labelsPerPage;
    const layout: LabelLayout = getLabelLayout(
      THEME.spacing.margin,
      THEME.spacing.margin + labelIndex * (labelHeight + THEME.spacing.gap),
      labelWidth,
      labelHeight
    );

    renderLabel(doc, formattedLabels[i], layout, logoUrl);
  }

  return new Uint8Array(doc.output('arraybuffer'));
}

// --- Logic Phases ---

/**
 * 1. Data Formatting Phase
 * Preparing Strings and generating QR codes locally.
 */
async function formatLabelData(label: LabelData, baseUrl: string): Promise<FormattedLabel> {
  const confirmUrl = `${baseUrl}/api/pedido/confirmar/${label.id}`;
  const qrDataUrl = await QRCode.toDataURL(confirmUrl, {
    margin: 1,
    width: 256,
    color: { dark: '#000000', light: '#ffffff' }
  });

  return {
    id: label.id,
    shortId: label.id.slice(-6).toUpperCase(),
    clientName: (label.client_name_cache || 'CLIENTE').toUpperCase(),
    address: label.clients?.address || 'SIN DIRECCION REGISTRADA',
    deliveryWindow: label.clients?.delivery_window || null,
    notes: label.notes,
    contact: `CONTACTO: ${label.clients?.phone || label.clients?.email || 'SIN DATOS'}`,
    bundleText: `${label.bundleIdx}/${label.totalBundles}`,
    dateText: DATE_FORMATTER.format(new Date(label.created_at)),
    qrDataUrl,
  };
}

/**
 * 2. Layout Calculation Phase
 * Defining where components sit within the label.
 */
function getLabelLayout(x: number, y: number, width: number, height: number): LabelLayout {
  const qrSize = 26; // Professional scale
  return {
    x, y, width, height,
    contentX: x + THEME.spacing.padding,
    contentY: y + THEME.spacing.headerHeight + THEME.spacing.padding,
    contentWidth: width - qrSize - (THEME.spacing.padding * 3),
    qrSize,
  };
}

/**
 * 3. Rendering Phase
 * Drawing to the jsPDF instance using theme tokens.
 */
function renderLabel(doc: jsPDF, data: FormattedLabel, layout: LabelLayout, logoUrl: string | null) {
  const { x, y, width, height, contentX, contentY, contentWidth, qrSize } = layout;

  // --- Outer Border ---
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, height, 2, 2);

  // --- Header ---
  doc.setFillColor(...THEME.colors.headerBg);
  doc.rect(x, y, width, THEME.spacing.headerHeight, 'F');

  doc.setTextColor(...THEME.colors.headerText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(THEME.fonts.header);
  doc.text('MR. BLONDE', contentX, y + 6.5);
  doc.text(`#${data.shortId}`, x + width - THEME.spacing.padding, y + 6.5, { align: 'right' });

  // --- QR Code ---
  const qrX = x + width - qrSize - THEME.spacing.padding;
  const qrY = y + THEME.spacing.headerHeight + THEME.spacing.padding;
  doc.addImage(data.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, data.id, 'FAST');

  // --- Client Info ---
  doc.setTextColor(...THEME.colors.primaryText);
  doc.setFontSize(THEME.fonts.title);
  doc.setFont('helvetica', 'bold');

  // Title (Client Name)
  const clientLines = doc.splitTextToSize(data.clientName, contentWidth);
  doc.text(clientLines, contentX, contentY);

  let currentY = contentY + (clientLines.length * 6);

  // Address
  doc.setFontSize(THEME.fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...THEME.colors.secondaryText);
  doc.text('DIRECCION:', contentX, currentY);

  currentY += 4;
  doc.setTextColor(...THEME.colors.primaryText);
  doc.setFont('helvetica', 'bold');
  const addrLines = doc.splitTextToSize(data.address, contentWidth);
  doc.text(addrLines, contentX, currentY);

  currentY += (addrLines.length * 4) + 4;

  // Delivery Window Badge
  if (data.deliveryWindow) {
    drawBadge(doc, contentX, currentY, contentWidth, data.deliveryWindow, 'accent');
    currentY += 10;
  }

  // Notes Badge
  if (data.notes) {
    drawBadge(doc, contentX, currentY, contentWidth, data.notes, 'accent', true);
    currentY += 10;
  }

  // --- Footer Decoration ---
  doc.setFillColor(...THEME.colors.footerBg);
  doc.rect(x, y + height - THEME.spacing.footerHeight, width, THEME.spacing.footerHeight, 'F');

  // Contact Info
  doc.setTextColor(...THEME.colors.mutedText);
  doc.setFontSize(THEME.fonts.small);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contact, contentX, y + height - 8);

  // Date
  doc.text(data.dateText, x + width - THEME.spacing.padding, y + height - 2, { align: 'right' });

  // --- Bundle ID Badge ---
  const badgeW = 18;
  const badgeH = 8;
  const badgeX = qrX + (qrSize - badgeW) / 2;
  const badgeY = qrY + qrSize + 4;

  doc.setFillColor(0, 0, 0);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');
  doc.setTextColor(...THEME.colors.headerText);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(data.bundleText, badgeX + badgeW / 2, badgeY + 5.5, { align: 'center' });
}

// --- Helpers ---

function drawBadge(doc: jsPDF, x: number, y: number, w: number, text: string, type: 'accent', isItalic = false) {
  const padding = 2;
  const fontSize = isItalic ? THEME.fonts.body - 1 : THEME.fonts.body;
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isItalic ? 'italic' : 'bold');

  const lines = doc.splitTextToSize(text, w - (padding * 2));
  const h = (lines.length * 4) + 2;

  doc.setFillColor(...THEME.colors.accentBg);
  doc.roundedRect(x, y - 3, w, h, 1, 1, 'F');

  doc.setDrawColor(...THEME.colors.accentBorder);
  doc.setLineWidth(0.3);
  doc.line(x, y - 3, x, y - 3 + h);

  doc.setTextColor(...THEME.colors.primaryText);
  doc.text(lines, x + padding, y + 1);
}
