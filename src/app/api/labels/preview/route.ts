import { NextRequest, NextResponse } from 'next/server';
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

const LOGO_PLACEHOLDER_PATH = "/branding/logo-placeholder.svg";

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

    const [{ data: orders, error }, settings] = await Promise.all([
      getOrdersBatch(selections.map((o: any) => o.id)),
      getSettings(),
    ]);
    
    if (error || !orders) {
      return NextResponse.json(
        { error: 'Error fetching orders' },
        { status: 500 }
      );
    }

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

    return NextResponse.json({
      labels: allLabels,
      logoUrl: settings.logo_url ?? LOGO_PLACEHOLDER_PATH,
    });
  } catch (error) {
    console.error('Preview Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
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
