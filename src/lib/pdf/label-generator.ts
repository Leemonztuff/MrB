import { jsPDF } from 'jspdf';

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

export async function generateLabelsPDF(
  labels: LabelData[],
  logoUrl: string | null,
  baseUrl: string
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 3;
  const gap = 2;
  const cols = 2;
  const rows = 2;
  const labelWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
  const labelHeight = (pageHeight - margin * 2 - gap * (rows - 1)) / rows;

  for (let i = 0; i < labels.length; i++) {
    if (i > 0 && i % 4 === 0) {
      doc.addPage('landscape');
    }

    const labelIndex = i % 4;
    const col = labelIndex % cols;
    const row = Math.floor(labelIndex / cols);
    const x = margin + col * (labelWidth + gap);
    const y = margin + row * (labelHeight + gap);

    drawCompactLabel(doc, labels[i], x, y, labelWidth, labelHeight, baseUrl);
  }

  return Buffer.from(doc.output('arraybuffer'));
}

function drawCompactLabel(
  doc: jsPDF,
  label: LabelData,
  x: number,
  y: number,
  width: number,
  height: number,
  baseUrl: string
) {
  const shortId = label.id?.slice(-6).toUpperCase() || 'N/A';
  const date = new Date(label.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);

  const headerH = 6;
  doc.setFillColor(26, 26, 26);
  doc.rect(x, y, width, headerH, 'F');

  doc.setTextColor(230, 213, 167);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('MR. BLONDE', x + 3, y + 4);
  doc.text(`#${shortId}`, x + width - 3, y + 4, { align: 'right' });

  const qrSize = 16;
  const qrX = x + width - qrSize - 3;
  const qrY = y + headerH + 2;

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=32x32&data=${encodeURIComponent(`${baseUrl}/api/pedido/confirmar/${label.id}`)}`;
    doc.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    doc.setFontSize(4);
    doc.setTextColor(100);
    doc.text('QR', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
  }

  const contentX = x + 3;
  const contentY = y + headerH + 2;
  const contentW = width - qrSize - 9;

  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const clientName = (label.client_name_cache || 'CLIENTE').toUpperCase();
  doc.text(clientName, contentX, contentY, { maxWidth: contentW });

  let lineY = contentY + 5;
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('DIRECCION:', contentX, lineY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const address = label.clients?.address || 'SIN DATOS';
  doc.text(address, contentX, lineY + 3, { maxWidth: contentW });

  lineY += 10;
  if (label.clients?.delivery_window) {
    doc.setFillColor(255, 251, 235);
    doc.rect(x + 3, lineY - 2, contentW, 5, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.2);
    doc.line(x + 3, lineY - 2, x + 3, lineY + 3);
    doc.setTextColor(0);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text(label.clients.delivery_window, contentX + 1, lineY + 1);
    lineY += 7;
  }

  if (label.notes) {
    doc.setFillColor(254, 243, 199);
    doc.rect(x + 3, lineY - 2, contentW, 5, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.line(x + 3, lineY - 2, x + 3, lineY + 3);
    doc.setTextColor(0);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'italic');
    const noteText = label.notes.length > 30 ? label.notes.substring(0, 27) + '...' : label.notes;
    doc.text(noteText, contentX + 1, lineY + 1, { maxWidth: contentW - 2 });
    lineY += 7;
  }

  const contact = label.clients?.phone || label.clients?.email || 'SIN CONTACTO';
  doc.setTextColor(100);
  doc.setFontSize(4);
  doc.setFont('helvetica', 'normal');
  doc.text(`CONTACTO: ${contact}`, contentX, y + height - 2);

  const badgeW = 12;
  const badgeH = 5;
  const badgeX = x + (width - badgeW) / 2;
  const badgeY = qrY + qrSize + 1;
  doc.setFillColor(0, 0, 0);
  doc.rect(badgeX, badgeY, badgeW, badgeH, 'F');
  doc.setTextColor(230, 213, 167);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${label.bundleIdx}/${label.totalBundles}`, badgeX + badgeW/2, badgeY + 3.5, { align: 'center' });

  doc.setFillColor(245, 245, 245);
  doc.rect(x, y + height - 3, width, 3, 'F');
  doc.setTextColor(100);
  doc.setFontSize(4);
  doc.text(date, x + width - 3, y + height - 1, { align: 'right' });
}
