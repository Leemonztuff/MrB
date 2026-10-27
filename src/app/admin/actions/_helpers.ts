
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireOperatorPinSession } from "@/lib/operator-pin-server";
import type { ActionResponse, AppRole } from "@/types";

// --- Generic Helpers ---

/**
 * Gets an authenticated Supabase client for admin actions.
 * Throws an error if the user is not authenticated as an admin.
 */
export async function getSupabaseClientWithAuth(allowedRoles: AppRole[] = ["super_admin"]) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || !allowedRoles.includes(user.app_metadata?.role)) {
        throw new Error("No tienes permisos para realizar esta acción.");
    }
    return supabase;
}

export async function getCurrentAppRole(): Promise<AppRole> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.app_metadata?.role;
    if (role !== "super_admin" && role !== "operario") {
        throw new Error("No tienes permisos para acceder a esta sección.");
    }
    return role;
}

export async function getOrderOperationsContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.app_metadata?.role;
    if (!user || (role !== "super_admin" && role !== "operario")) {
        throw new Error("No tienes permisos para gestionar pedidos.");
    }
    if (role === "operario") {
        if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
        await requireOperatorPinSession(user.id);
        return { supabase: supabaseAdmin, role };
    }
    return { supabase, role };
}

/**
 * Standardized wrapper for handling server action logic with error catching and auth.
 */
export async function handleAction<T>(
    actionFn: () => Promise<T>,
    revalidatePaths: string[] = []
): Promise<ActionResponse<T>> {
    try {
        const data = await actionFn();

        if (revalidatePaths.length > 0) {
            revalidatePaths.forEach(path => {
                if (path.includes("[")) {
                    revalidatePath(path, "page");
                } else {
                    revalidatePath(path);
                }
            });
        }

        return { success: true, data };
    } catch (error: any) {
        unstable_rethrow(error);
        console.error("Action error:", error.message);
        return {
            success: false,
            error: {
                message: error.message || "Ocurrió un error inesperado.",
                code: error.code
            }
        };
    }
}

export async function upsertEntity<T = any>(
    tableName: string,
    payload: { id?: string, [key: string]: any },
    revalidatePaths: string[]
): Promise<ActionResponse<T>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { id, ...data } = payload;

        const query = supabase.from(tableName);
        const { data: result, error } = id
            ? await query.update(data).eq("id", id).select().single()
            : await query.insert(data).select().single();

        if (error) throw error;
        return result as T;
    }, revalidatePaths);
}

export async function deleteEntity(
    tableName: string,
    id: string,
    revalidatePaths: string[]
): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { error } = await supabase.from(tableName).delete().eq("id", id);
        if (error) throw error;
        return null;
    }, revalidatePaths);
}
