import { NextResponse } from 'next/server';
import { getPortalClient } from '@/app/actions/portal.actions';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
    const client = await getPortalClient();
    if (!client) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = await createClient();
    
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', id)
        .eq('client_id', client.id)
        .single();

    if (error || !order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json(order);
}
