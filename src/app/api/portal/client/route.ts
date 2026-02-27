import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { getPortalClient } = await import('@/app/actions/portal.actions');
        const client = await getPortalClient();
        
        if (!client) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            client: {
                id: client.id,
                contact_name: client.contact_name,
                email: client.email,
                address: client.address,
                created_at: client.created_at,
                status: client.status,
                agreement_id: client.agreement_id,
                agreements: client.agreements,
                cuit: client.cuit
            }
        });
    } catch (error) {
        console.error('Error in /api/portal/client:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: String(error) },
            { status: 500 }
        );
    }
}
