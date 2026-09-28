
"use server";

import { handleAction, getSupabaseClientWithAuth, upsertEntity, deleteEntity } from "./_helpers";
import type { Promotion } from "@/types";
import type { ActionResponse } from "@/types";

// --- Promotion Actions ---

export async function getPromotions(): Promise<ActionResponse<Promotion[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase.from("promotions").select("*").order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  });
}

type UpsertPromotionPayload = Omit<Promotion, "id" | "created_at" | "rules"> & {
  id?: string;
  rules: any;
};

export async function upsertPromotion(payload: UpsertPromotionPayload) {
  const revalidatePaths = ["/admin/commercial-settings", `/admin/agreements`];
  return await upsertEntity("promotions", payload, revalidatePaths);
}

export async function deletePromotion(id: string) {
  const revalidatePaths = ["/admin/commercial-settings", "/admin/agreements"];
  return await deleteEntity("promotions", id, revalidatePaths);
}

