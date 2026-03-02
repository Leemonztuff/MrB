"use server";

import { getSupabaseClientWithAuth, handleAction } from "./_helpers";
import type { ActionResponse } from "@/types";
import type { NewsPost } from "@/types";

export async function getNews(): Promise<ActionResponse<NewsPost[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_active', true)
      .or('starts_at.is.null,starts_at.lte.now()')
      .or('ends_at.is.null,ends_at.gte.now()')
      .order('display_order', { ascending: false })
      .limit(3);

    if (error) throw error;
    return data || [];
  });
}

export async function getAllNews(): Promise<ActionResponse<NewsPost[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('display_order', { ascending: false });

    if (error) throw error;
    return data || [];
  });
}

export async function getNewsById(id: string): Promise<ActionResponse<NewsPost>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  });
}

export async function createNews(
  payload: {
    title: string;
    content: string;
    image_url?: string;
    is_active?: boolean;
    display_order?: number;
    starts_at?: string;
    ends_at?: string;
  }
): Promise<ActionResponse<NewsPost>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, ['/admin/news']);
}

export async function updateNews(
  id: string,
  payload: {
    title?: string;
    content?: string;
    image_url?: string;
    is_active?: boolean;
    display_order?: number;
    starts_at?: string;
    ends_at?: string;
  }
): Promise<ActionResponse<NewsPost>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, ['/admin/news']);
}

export async function deleteNews(id: string): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return null;
  }, ['/admin/news']);
}
