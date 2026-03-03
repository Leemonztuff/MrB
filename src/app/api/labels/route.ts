import { NextRequest, NextResponse } from 'next/server';
import { generateLabelsPDF } from '@/lib/pdf/label-generator';
import { getOrdersBatch } from '@/app/admin/actions/orders.actions';
import { getSettings } from '@/app/admin/actions/settings.actions';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selections } = body;

    if (!selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { error: 'Invalid request: selections array required' },
        { status: 400 }
      );
    }

    const { data: orders, error } = await getOrdersBatch(selections.map((o: any) => o.id));

    if (error || !orders) {
      return NextResponse.json(
        { error: 'Error fetching orders' },
        { status: 500 }
      );
    }

    const settings = await getSettings();
    const logoUrl = settings.logo_url ?? null;

    // Get base URL from request origin to ensure it matches the current environment
    const url = new URL(request.url);
    const baseUrl = url.origin;

    const allLabels: LabelData[] = [];
    selections.forEach((sel: { id: string; bundles: number }) => {
      const order = orders.find((o: any) => o.id === sel.id);
      if (order) {
        for (let i = 1; i <= sel.bundles; i++) {
          allLabels.push({
            id: order.id,
            client_name_cache: order.client_name_cache,
            created_at: order.created_at,
            notes: order.notes || null,
            bundleIdx: i,
            totalBundles: sel.bundles,
            clients: order.clients ?? null,
          });
        }
      }
    });

    if (allLabels.length === 0) {
      return NextResponse.json(
        { error: 'No labels to generate' },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateLabelsPDF(allLabels, logoUrl, baseUrl);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rotulos-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
