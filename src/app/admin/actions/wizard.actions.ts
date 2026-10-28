"use server";

import { handleAction, getSupabaseClientWithAuth } from "./_helpers";
import { buildWizardSteps, type WizardStep } from "@/lib/wizard";
import type { ActionResponse } from "@/types";

function isWizardEnabled(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "false";
  return true;
}

export async function getWizardGuideData(): Promise<ActionResponse<{
  enabled: boolean;
  steps: WizardStep[];
}>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const [settingsResult, products, priceLists, agreements, clients, orders] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "wizard_enabled").maybeSingle(),
      supabase.from("products").select("id").limit(1),
      supabase.from("price_lists").select("id").limit(1),
      supabase.from("agreements").select("id").limit(1),
      supabase.from("clients").select("id").limit(1),
      supabase.from("orders").select("id").limit(1),
    ]);

    for (const result of [settingsResult, products, priceLists, agreements, clients, orders]) {
      if (result.error) throw result.error;
    }

    const exists = (rows: { id: string }[] | null) => (rows?.length ?? 0) > 0;

    return {
      enabled: isWizardEnabled(settingsResult.data?.value),
      steps: buildWizardSteps({
        products: exists(products.data) ? 1 : 0,
        priceLists: exists(priceLists.data) ? 1 : 0,
        agreements: exists(agreements.data) ? 1 : 0,
        clients: exists(clients.data) ? 1 : 0,
        orders: exists(orders.data) ? 1 : 0,
      }),
    };
  });
}

export async function setWizardEnabled(enabled: boolean): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "wizard_enabled", value: Boolean(enabled) }, { onConflict: "key" });
    if (error) throw error;
    return null;
  }, ["/admin", "/admin/settings"]);
}
