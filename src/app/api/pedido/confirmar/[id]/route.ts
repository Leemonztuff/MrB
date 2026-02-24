
import { NextRequest, NextResponse } from "next/server";
import { publicConfirmOrder } from "@/app/admin/actions/orders.actions";
import { redirect } from "next/navigation";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Ejecutar la confirmación (esto llamará a revalidatePath de forma segura)
        await publicConfirmOrder(id);
    } catch (error) {
        console.error("Error en auto-confirmación vía API:", error);
        // Continuamos a la página de todos modos para que el portal maneje el estado de error o ya confirmado
    }

    // Redirigir al portal de confirmación (que ahora solo mostrará el mensaje de éxito)
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/pedido/confirmar/${id}`);
}
