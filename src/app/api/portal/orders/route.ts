import { NextResponse } from 'next/server';
import { getClientOrders } from '@/app/actions/portal-client.actions';

export async function GET() {
    const result = await getClientOrders();
    
    if (!result.success) {
        const status = result.error?.code === 'UNAUTHORIZED' ? 401 : 500;

        return NextResponse.json(
            { error: result.error?.message },
            { status }
        );
    }

    return NextResponse.json(result.data);
}
