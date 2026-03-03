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
    headerBg: [0, 0, 0] as [number, number, number],
    headerText: [255, 255, 255] as [number, number, number],
    primaryText: [0, 0, 0] as [number, number, number],
    secondaryText: [0, 0, 0] as [number, number, number],
    mutedText: [60, 60, 60] as [number, number, number],
    accentBg: [255, 255, 255] as [number, number, number],
    accentBorder: [0, 0, 0] as [number, number, number],
    footerBg: [255, 255, 255] as [number, number, number],
  },
  spacing: {
    margin: 5,
    padding: 8,
    gap: 4,
    headerHeight: 16,
    footerHeight: 8,
  },
  fonts: {
    title: 18,
    header: 14,
    body: 12,
    small: 9,
  }
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
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
  const confirmUrl = `${baseUrl}/pedido/confirmar/${label.id}`;

  // Generate QR code locally as a DataURL (base64)
  // This is much more reliable than fetching from an external API in a server environment
  const qrDataUrl = await QRCode.toDataURL(confirmUrl, {
    margin: 2,
    width: 1200, // Even higher resolution for ultra-sharp printing
    color: {
      dark: '#000000',
      light: '#ffffff',
    }
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
  const qrSize = 45; // Increased for better scanability
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
  doc.setLineWidth(0.6); // Slightly thicker for B&W clarity
  doc.roundedRect(x, y, width, height, 1, 1);

  // --- Header ---
  doc.setFillColor(...THEME.colors.headerBg);
  doc.rect(x, y, width, THEME.spacing.headerHeight, 'F');

  doc.setTextColor(...THEME.colors.headerText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(THEME.fonts.header);
  doc.text('MR. BLONDE', contentX, y + 10); // Adjusted for taller header
  doc.text(`#${data.shortId}`, x + width - THEME.spacing.padding, y + 10, { align: 'right' });

  // --- QR Code ---
  const qrX = x + width - qrSize - THEME.spacing.padding;
  const qrY = y + THEME.spacing.headerHeight + THEME.spacing.padding;
  doc.addImage(data.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, data.id, 'NONE');

  // --- Client Info ---
  doc.setTextColor(...THEME.colors.primaryText);
  doc.setFontSize(THEME.fonts.title);
  doc.setFont('helvetica', 'bold');

  // Title (Client Name) - Stark and Large
  const clientLines = doc.splitTextToSize(data.clientName, contentWidth);
  doc.text(clientLines, contentX, contentY + 4);

  let currentY = contentY + (clientLines.length * 7) + 2;

  // Address Section
  doc.setFontSize(THEME.fonts.small);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.colors.secondaryText);
  doc.text('DIRECCION:', contentX, currentY);

  currentY += 4.5;
  doc.setFontSize(THEME.fonts.body);
  doc.setFont('helvetica', 'bold'); // Bold address for legibility
  doc.setTextColor(...THEME.colors.primaryText);
  const addrLines = doc.splitTextToSize(data.address, contentWidth);
  doc.text(addrLines, contentX, currentY);

  currentY += (addrLines.length * 5) + 6;

  // Delivery Window & Notes - High Contrast B&W
  if (data.deliveryWindow) {
    drawHighContrastBadge(doc, contentX, currentY, contentWidth, `HORARIO: ${data.deliveryWindow}`);
    currentY += 12;
  }

  if (data.notes) {
    drawHighContrastBadge(doc, contentX, currentY, contentWidth, `NOTAS: ${data.notes}`, true);
    currentY += 12;
  }

  // --- Footer Decoration ---
  doc.setLineWidth(0.3);
  doc.setDrawColor(200);
  doc.line(x + THEME.spacing.padding, y + height - 10, x + width - THEME.spacing.padding, y + height - 10);

  // Contact Info
  doc.setTextColor(...THEME.colors.mutedText);
  doc.setFontSize(THEME.fonts.small);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contact, contentX, y + height - 6);

  // Date
  doc.text(data.dateText, x + width - THEME.spacing.padding, y + height - 6, { align: 'right' });

  // --- Bundle ID Badge ---
  const badgeW = 22; // Larger
  const badgeH = 10; // Larger
  const badgeX = qrX + (qrSize - badgeW) / 2;
  const badgeY = qrY + qrSize + 5;

  doc.setFillColor(0, 0, 0);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 0.5, 0.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12); // Larger
  doc.setFont('helvetica', 'bold');
  doc.text(data.bundleText, badgeX + badgeW / 2, badgeY + 6.5, { align: 'center' });
}

function drawHighContrastBadge(doc: jsPDF, x: number, y: number, w: number, text: string, isItalic = false) {
  const padding = 3;
  doc.setFontSize(THEME.fonts.body - 1);
  doc.setFont('helvetica', isItalic ? 'italic' : 'bold');

  const lines = doc.splitTextToSize(text, w - (padding * 2) - 4);
  const h = (lines.length * 4.5) + 4;

  // Stark Border instead of color fill
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(x, y - 4, w, h);

  // Thick left indicator bar
  doc.setFillColor(0, 0, 0);
  doc.rect(x, y - 4, 1.5, h, 'F');

  doc.setTextColor(...THEME.colors.primaryText);
  doc.text(lines, x + padding + 1, y - 4 + padding + 2);
}
