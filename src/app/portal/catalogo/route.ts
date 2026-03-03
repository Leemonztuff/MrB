import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { getPortalClient } = await import("@/app/actions/portal.actions");
    const client = await getPortalClient();

    const productId = request.nextUrl.searchParams.get('productId');
    const newsId = request.nextUrl.searchParams.get('newsId');
    const promoId = request.nextUrl.searchParams.get('promoId');
    const agreementId = client?.agreement_id;

    if (!agreementId) {
        return NextResponse.redirect(new URL('/portal', request.url));
    }

    const targetUrl = new URL(`/pedido/${agreementId}`, request.url);
    if (productId) targetUrl.searchParams.set('productId', productId);
    if (newsId) targetUrl.searchParams.set('newsId', newsId);
    if (promoId) targetUrl.searchParams.set('promoId', promoId);

    return NextResponse.redirect(targetUrl);
}
