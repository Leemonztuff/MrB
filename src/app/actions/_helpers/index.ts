
"use server";

import { createClient } from "@/lib/supabase/server";
import { ActionResponse } from "@/types";

/**
 * Gets an authenticated Supabase client for portal actions.
 * Returns null if the client is not authenticated.
 */
export async function getPortalSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }
  return supabase;
}

/**
 * Gets the authenticated client user from the portal.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedClient() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('*, agreements(agreement_name)')
    .eq('id', user.id)
    .single();

  return client;
}

/**
 * Standardized wrapper for handling portal server action logic with error catching.
 */
export async function handlePortalAction<T>(
  actionFn: () => Promise<T>,
  revalidatePaths: string[] = []
): Promise<ActionResponse<T>> {
  try {
    const data = await actionFn();
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
    console.error('Portal action error:', message);
    return {
      success: false,
      error: {
        message,
      }
    };
  }
}
