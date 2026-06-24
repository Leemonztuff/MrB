
import { NextRequest, NextResponse } from "next/server";
import { publicConfirmOrder } from "@/app/admin/actions/orders.actions";
import { redirect } from "next/navigation";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
        const origin = new URL(request.url).origin;
        return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=missing_token`);
    }

    try {
        await publicConfirmOrder(id, token);
    } catch (error) {
        console.error("Error en auto-confirmación vía API:", error);
        const origin = new URL(request.url).origin;
        return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=confirmation_failed`);
    }

    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/pedido/confirmar/${id}`);
}
