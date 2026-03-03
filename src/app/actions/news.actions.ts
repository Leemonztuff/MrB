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
      .order('display_order', { ascending: false });

    if (error) {
      console.error('News error:', error);
      return { success: false, error: { message: error.message } };
    }

    // Filter by date in JavaScript to be 100% sure about the logic
    const activeNews = (data || []).filter(item => {
      const starts = item.starts_at ? new Date(item.starts_at) : null;
      const ends = item.ends_at ? new Date(item.ends_at) : null;
      const nowTime = new Date();

      if (starts && starts > nowTime) return false;
      if (ends && ends < nowTime) return false;
      return true;
    });

    console.log(`Fetched ${data?.length} raw news, ${activeNews.length} active after filtering.`);

    return { success: true, data: activeNews };
  } catch (error) {
    console.error('News exception:', error);
    return { success: true, data: [] };
  }
}
