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
  const labelWidth = (pageWidth - margin * 3) / 2;
  const labelHeight = (pageHeight - margin * 3) / 2;

  const labelsPerPage = 4;
  const pages: LabelData[][] = [];
  
  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage));
  }

  pages.forEach((pageLabels, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    pageLabels.forEach((label, labelIndex) => {
      const col = labelIndex % 2;
      const row = Math.floor(labelIndex / 2);
      const x = margin + col * (labelWidth + margin);
      const y = margin + row * (labelHeight + margin);

      drawLabel(doc, label, x, y, labelWidth, labelHeight, baseUrl);
    });
  });

  return Buffer.from(doc.output('arraybuffer'));
}

function drawLabel(
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
    year: 'numeric',
  });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height);

  const headerHeight = 12;
  doc.setFillColor(26, 26, 26);
  doc.rect(x, y, width, headerHeight, 'F');

  doc.setTextColor(230, 213, 167);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MR. BLONDE', x + 4, y + 8);

  doc.setFontSize(9);
  doc.text(`#${shortId}`, x + width - 4, y + 8, { align: 'right' });

  const contentPadding = 5;
  const qrSize = 28;
  const qrX = x + width - qrSize - contentPadding;
  const qrY = y + headerHeight + 8;

  try {
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${baseUrl}/api/pedido/confirmar/${label.id}`)}`;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text('QR', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
  }

  const mainX = x + contentPadding;
  const mainY = y + headerHeight + 6;
  const mainWidth = width - qrSize - contentPadding * 2;

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const clientName = label.client_name_cache || 'Cliente';
  doc.text(clientName.toUpperCase(), mainX, mainY, { maxWidth: mainWidth });

  let textY = mainY + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('DIRECCIÓN:', mainX, textY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const address = label.clients?.address || 'Sin dirección';
  doc.text(address, mainX, textY + 4, { maxWidth: mainWidth });

  textY += 14;
  if (label.clients?.delivery_window) {
    doc.setFillColor(255, 251, 235);
    doc.rect(x + contentPadding, textY - 3, mainWidth, 8, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.line(x + contentPadding, textY - 3, x + contentPadding, textY + 5);
    
    doc.setTextColor(0);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`📅 ${label.clients.delivery_window}`, mainX + 2, textY + 2);
    textY += 10;
  }

  if (label.notes) {
    doc.setFillColor(254, 243, 199);
    doc.rect(x + contentPadding, textY - 3, mainWidth, 8, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.line(x + contentPadding, textY - 3, x + contentPadding, textY + 5);
    
    doc.setTextColor(0);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    const truncatedNotes = label.notes.length > 50 ? label.notes.substring(0, 47) + '...' : label.notes;
    doc.text(`📝 ${truncatedNotes}`, mainX + 2, textY + 2, { maxWidth: mainWidth - 4 });
    textY += 10;
  }

  const contact = label.clients?.phone || label.clients?.email || 'Sin contacto';
  doc.setTextColor(100);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contacto: ${contact}`, mainX, y + height - 8);

  const badgeX = x + (width - 20) / 2;
  const badgeY = qrY + qrSize + 4;
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(badgeX, badgeY, 20, 8, 1, 1, 'F');
  doc.setTextColor(230, 213, 167);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${label.bundleIdx}/${label.totalBundles}`, badgeX + 10, badgeY + 5.5, { align: 'center' });

  doc.setFillColor(245, 245, 245);
  doc.rect(x, y + height - 6, width, 6, 'F');
  doc.setTextColor(100);
  doc.setFontSize(6);
  doc.text(date, x + width - 4, y + height - 2, { align: 'right' });
}
