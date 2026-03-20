import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { getPortalClientData } = await import('@/app/actions/portal-client.actions');
        const result = await getPortalClientData();

        if (!result.success || !result.data?.client) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            client: result.data.client,
            pendingChanges: result.data.pendingChanges || [],
        });
    } catch (error) {
        console.error('Error in /api/portal/client:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: String(error) },
            { status: 500 }
        );
    }
}
