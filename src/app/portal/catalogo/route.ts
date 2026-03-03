import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, maybe it's a portal token session. 
    // The portal uses a cookie-based session usually.
    // Let's check the client record associated with the session.

    const { data: client } = await supabase
        .from('clients')
        .select('agreement_id')
        .eq('portal_token', request.cookies.get('portal_token')?.value || '')
        .single();

    const productId = request.nextUrl.searchParams.get('productId');
    const agreementId = client?.agreement_id;

    if (!agreementId) {
        return NextResponse.redirect(new URL('/portal', request.url));
    }

    const targetUrl = new URL(`/pedido/${agreementId}`, request.url);
    if (productId) {
        targetUrl.searchParams.set('productId', productId);
    }

    return NextResponse.redirect(targetUrl);
}
