
"use server";

import { getSupabaseClientWithAuth, upsertEntity, deleteEntity } from "./_helpers";
import type { SalesCondition } from "@/types";

// --- Sales Condition Actions ---

export async function getSalesConditions() {
  const supabase = await getSupabaseClientWithAuth();
  const { data, error } = await supabase.from("sales_conditions").select("*").order("name", { ascending: true });
  if (error) {
    console.error("getSalesConditions error:", error.message);
    throw error;
  }
  return { data, error };
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

