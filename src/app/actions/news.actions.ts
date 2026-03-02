"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import type { ActionResponse } from "@/types";
import type { NewsPost } from "@/types";

export async function getPublicNews(): Promise<ActionResponse<NewsPost[]>> {
  try {
    const supabase = await createServerClient();
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('display_order', { ascending: false })
      .limit(3);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Error al cargar noticias",
      },
    };
  }
}
