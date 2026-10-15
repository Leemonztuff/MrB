
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

    const result = await publicConfirmOrder(id, token);

    if (!result.success) {
        const message = result.error?.message ?? "";
        console.error("Error en auto-confirmación vía API:", message);
        if (message.includes('inválido')) {
            return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=invalid_token`);
        }
        if (message.includes('no encontrado')) {
            return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=not_found`);
        }
        if (message.includes('estado actual')) {
            return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=invalid_status`);
        }
        return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=confirmation_failed`);
    }

    return NextResponse.redirect(`${origin}/pedido/confirmar/${id}`);
}
