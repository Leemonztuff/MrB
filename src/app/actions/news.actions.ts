"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import type { ActionResponse } from "@/types";
import type { NewsPost } from "@/types";
import { getPortalClient } from "@/app/actions/portal.actions";

export async function getPublicNews(): Promise<ActionResponse<NewsPost[]>> {
  noStore();
  try {
    const supabase = await createServerClient();
    const portalClient = await getPortalClient();

    const clientType = portalClient?.agreements?.client_type || null;

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: false });

    if (error) {
      console.error('News error:', error);
      return { success: false, error: { message: error.message } };
    }

    // Filter by date and client type
    const nowTime = new Date();
    const activeNews = (data || []).filter(item => {
      // Date filtering
      const starts = item.starts_at ? new Date(item.starts_at) : null;
      const ends = item.ends_at ? new Date(item.ends_at) : null;

      if (starts && starts > nowTime) return false;
      if (ends && ends < nowTime) return false;

      // Client type filtering - show news that:
      // 1. Have no target_client_type (visible to all)
      // 2. Match the client's agreement type
      const targetType = item.target_client_type;
      if (targetType && targetType !== clientType) return false;

      return true;
    });

    if (activeNews.length === 0) {
      return { success: true, data: [] };
    }

    const newsIds = activeNews.map((item) => item.id);
    const { data: likesData, error: likesError } = await supabase
      .from('news_likes')
      .select('news_id, client_id')
      .in('news_id', newsIds);

    if (likesError) {
      console.error('News likes error:', likesError);
      return {
        success: true,
        data: activeNews.map((item) => ({
          ...item,
          likes_count: 0,
          liked_by_current_client: false,
        })),
      };
    }

    const likesByNewsId = (likesData || []).reduce((acc, like) => {
      const current = acc[like.news_id] || { count: 0, liked: false };
      current.count += 1;
      if (portalClient?.id && like.client_id === portalClient.id) {
        current.liked = true;
      }
      acc[like.news_id] = current;
      return acc;
    }, {} as Record<string, { count: number; liked: boolean }>);

    return {
      success: true,
      data: activeNews.map((item) => ({
        ...item,
        likes_count: likesByNewsId[item.id]?.count || 0,
        liked_by_current_client: likesByNewsId[item.id]?.liked || false,
      })),
    };
  } catch (error) {
    console.error('News exception:', error);
    return { success: false, error: { message: 'No se pudieron cargar las novedades.' } };
  }
}

export async function toggleNewsLike(
  newsId: string
): Promise<ActionResponse<{ liked: boolean; likes_count: number }>> {
  noStore();

  try {
    const portalClient = await getPortalClient();
    if (!portalClient?.id) {
      return { success: false, error: { message: 'Sesion de portal no valida.' } };
    }

    const supabase = await createServerClient();
    const { data: existingLike, error: existingError } = await supabase
      .from('news_likes')
      .select('news_id, client_id')
      .eq('news_id', newsId)
      .eq('client_id', portalClient.id)
      .maybeSingle();

    if (existingError) {
      console.error('Toggle news like existing error:', existingError);
      return { success: false, error: { message: existingError.message } };
    }

    let liked = false;

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('news_likes')
        .delete()
        .eq('news_id', newsId)
        .eq('client_id', portalClient.id);

      if (deleteError) {
        console.error('Toggle news like delete error:', deleteError);
        return { success: false, error: { message: deleteError.message } };
      }
    } else {
      const { error: insertError } = await supabase
        .from('news_likes')
        .insert({ news_id: newsId, client_id: portalClient.id });

      if (insertError) {
        console.error('Toggle news like insert error:', insertError);
        return { success: false, error: { message: insertError.message } };
      }

      liked = true;
    }

    const { count, error: countError } = await supabase
      .from('news_likes')
      .select('*', { count: 'exact', head: true })
      .eq('news_id', newsId);

    if (countError) {
      console.error('Toggle news like count error:', countError);
      return { success: false, error: { message: countError.message } };
    }

    return {
      success: true,
      data: {
        liked,
        likes_count: count || 0,
      },
    };
  } catch (error) {
    console.error('Toggle news like exception:', error);
    return { success: false, error: { message: 'No se pudo actualizar el me gusta.' } };
  }
}
