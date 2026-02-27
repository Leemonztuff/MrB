import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { getPortalClientData } = await import('@/app/actions/portal-client.actions');
        const result = await getPortalClientData();
        
        if (!result.success) {
            return NextResponse.json(
                { error: result.error?.message },
                { status: 401 }
            );
        }

        return NextResponse.json(result.data);
    } catch (error) {
        console.error('Error in /api/portal/client:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
