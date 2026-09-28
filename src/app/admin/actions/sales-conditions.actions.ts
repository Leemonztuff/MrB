
"use server";

import { handleAction, getSupabaseClientWithAuth, upsertEntity, deleteEntity } from "./_helpers";
import type { SalesCondition } from "@/types";
import type { ActionResponse } from "@/types";

// --- Sales Condition Actions ---

export async function getSalesConditions(): Promise<ActionResponse<SalesCondition[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase.from("sales_conditions").select("*").order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  });
}

type UpsertSalesConditionPayload = Omit<SalesCondition, "id" | "created_at" | "rules"> & {
  id?: string;
  rules: any;
};

export async function upsertSalesCondition(payload: UpsertSalesConditionPayload) {
  const revalidatePaths = ["/admin/commercial-settings", "/admin/agreements"];
  return await upsertEntity("sales_conditions", payload, revalidatePaths);
}

export async function deleteSalesCondition(id: string) {
  const revalidatePaths = ["/admin/commercial-settings", "/admin/agreements"];
  return await deleteEntity("sales_conditions", id, revalidatePaths);
}

