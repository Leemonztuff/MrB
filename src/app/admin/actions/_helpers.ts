
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ActionResponse } from "@/types";

// --- Generic Helpers ---

/**
 * Gets an authenticated Supabase client for admin actions.
 * Throws an error if the user is not authenticated as an admin.
 */
export async function getSupabaseClientWithAuth() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== 'super_admin' && user.role !== 'authenticated') {
        throw new Error("No tienes permisos de administrador para realizar esta acción.");
    }
    return supabase;
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
            revalidatePaths.forEach(path => revalidatePath(path));
        }

        return { success: true, data };
    } catch (error: any) {
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
