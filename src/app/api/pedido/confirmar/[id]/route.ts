
import { NextRequest, NextResponse } from "next/server";
import { publicConfirmOrder } from "@/app/admin/actions/orders.actions";
import { redirect } from "next/navigation";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const token = body.token;

    if (!token) {
        return NextResponse.json({ error: "PIN requerido" }, { status: 400 });
    }

    try {
        const result = await publicConfirmOrder(id, token);
        if (result.error) {
            return NextResponse.json({ error: result.error.message }, { status: 401 });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error en confirmación vía API:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
