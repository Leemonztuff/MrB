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
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 5;
  const gap = 3;
  const labelsPerPage = 3;
  const labelHeight = (pageHeight - margin * 2 - gap * (labelsPerPage - 1)) / labelsPerPage;
  const labelWidth = pageWidth - margin * 2;

  for (let i = 0; i < labels.length; i++) {
    if (i > 0 && i % labelsPerPage === 0) {
      doc.addPage('portrait');
    }

    const labelIndex = i % labelsPerPage;
    const x = margin;
    const y = margin + labelIndex * (labelHeight + gap);

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
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, height, 2, 2);

  const headerH = 10;
  doc.setFillColor(26, 26, 26);
  doc.rect(x, y, width, headerH, 'F');

  doc.setTextColor(230, 213, 167);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MR. BLONDE', x + 5, y + 6.5);
  doc.text(`#${shortId}`, x + width - 5, y + 6.5, { align: 'right' });

  const qrSize = 24;
  const qrX = x + width - qrSize - 5;
  const qrY = y + headerH + 5;

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=48x48&data=${encodeURIComponent(`${baseUrl}/api/pedido/confirmar/${label.id}`)}`;
    doc.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text('QR', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
  }

  const contentX = x + 5;
  const contentY = y + headerH + 5;
  const contentW = width - qrSize - 15;

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const clientName = (label.client_name_cache || 'CLIENTE').toUpperCase();
  doc.text(clientName, contentX, contentY, { maxWidth: contentW });

  let lineY = contentY + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('DIRECCION:', contentX, lineY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const address = label.clients?.address || 'SIN DATOS';
  doc.text(address, contentX, lineY + 5, { maxWidth: contentW });

  lineY += 15;
  if (label.clients?.delivery_window) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(x + 5, lineY - 3, contentW, 8, 1, 1, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.line(x + 5, lineY - 3, x + 5, lineY + 5);
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label.clients.delivery_window, contentX + 2, lineY + 2);
    lineY += 12;
  }

  if (label.notes) {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(x + 5, lineY - 3, contentW, 8, 1, 1, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.line(x + 5, lineY - 3, x + 5, lineY + 5);
    doc.setTextColor(0);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    const noteText = label.notes.length > 50 ? label.notes.substring(0, 47) + '...' : label.notes;
    doc.text(noteText, contentX + 2, lineY + 2, { maxWidth: contentW - 4 });
    lineY += 12;
  }

  const contact = label.clients?.phone || label.clients?.email || 'SIN CONTACTO';
  doc.setTextColor(100);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`CONTACTO: ${contact}`, contentX, y + height - 8);

  const badgeW = 16;
  const badgeH = 7;
  const badgeX = x + (width - badgeW) / 2;
  const badgeY = qrY + qrSize + 3;
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');
  doc.setTextColor(230, 213, 167);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${label.bundleIdx}/${label.totalBundles}`, badgeX + badgeW/2, badgeY + 5, { align: 'center' });

  doc.setFillColor(245, 245, 245);
  doc.rect(x, y + height - 6, width, 6, 'F');
  doc.setTextColor(100);
  doc.setFontSize(6);
  doc.text(date, x + width - 5, y + height - 2, { align: 'right' });
}
