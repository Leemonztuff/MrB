"use server";

import { getSupabaseClientWithAuth, handleAction } from "./_helpers";
import type { ActionResponse } from "@/types";
import type { NewsPost } from "@/types";

export async function getNews(): Promise<ActionResponse<NewsPost[]>> {
  try {
    const supabase = await getSupabaseClientWithAuth();
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('display_order', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Public news error:', error);
      return { success: true, data: [] };
    }
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Public news exception:', error);
    return { success: true, data: [] };
  }
}

export async function getAllNews(): Promise<ActionResponse<NewsPost[]>> {
  try {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('display_order', { ascending: false });

    if (error) {
      console.error('News fetch error:', error);
      return { success: true, data: [] };
    }
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('News fetch exception:', error);
    return { success: true, data: [] };
  }
}

export async function getNewsById(id: string): Promise<ActionResponse<NewsPost>> {
  try {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get news by id error:', error);
      return { success: false, error: { message: error.message } };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('Get news by id exception:', error);
    return { success: false, error: { message: error.message } };
  }
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
  try {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Create news error:', error);
      return { success: false, error: { message: error.message } };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('Create news exception:', error);
    return { success: false, error: { message: error.message } };
  }
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
  try {
    const supabase = await getSupabaseClientWithAuth();
    
    const { data, error } = await supabase
      .from('news')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update news error:', error);
      return { success: false, error: { message: error.message } };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('Update news exception:', error);
    return { success: false, error: { message: error.message } };
  }
}

export async function deleteNews(id: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await getSupabaseClientWithAuth();
    
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete news error:', error);
      return { success: false, error: { message: error.message } };
    }
    return { success: true, data: null };
  } catch (error: any) {
    console.error('Delete news exception:', error);
    return { success: false, error: { message: error.message } };
  }
}
