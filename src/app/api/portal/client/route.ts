import { NextResponse } from 'next/server';
import { getPortalClientData } from '@/app/actions/portal-client.actions';

export async function GET() {
    const result = await getPortalClientData();
    
    if (!result.success) {
        return NextResponse.json(
            { error: result.error?.message },
            { status: 401 }
        );
    }

    return NextResponse.json(result.data);
}
