
import { NextRequest, NextResponse } from "next/server";
import { publicConfirmOrder } from "@/app/admin/actions/orders.actions";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get('token');
    const origin = new URL(request.url).origin;

    if (!token) {
        return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=missing_token`);
    }

    try {
        await publicConfirmOrder(id, token);
    } catch (error: any) {
        console.error("Error en auto-confirmación vía API:", error.message);
        if (error.message?.includes('inválido')) {
            return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=invalid_token`);
        }
        if (error.message?.includes('no encontrado')) {
            return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=not_found`);
        }
        if (error.message?.includes('estado actual')) {
            return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=invalid_status`);
        }
        return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=confirmation_failed`);
    }

    return NextResponse.redirect(`${origin}/pedido/confirmar/${id}`);
}
