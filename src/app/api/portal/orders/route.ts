import { NextResponse } from 'next/server';
import { getClientOrders } from '@/app/actions/portal-client.actions';

export async function GET() {
    const result = await getClientOrders();
    
    if (!result.success) {
        return NextResponse.json(
            { error: result.error?.message },
            { status: 401 }
        );
    }

    return NextResponse.json(result.data);
}
