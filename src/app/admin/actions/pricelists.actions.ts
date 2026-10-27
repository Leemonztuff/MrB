
"use server";

import { revalidatePath } from "next/cache";
import { handleAction, getSupabaseClientWithAuth, upsertEntity, deleteEntity } from "./_helpers";
import type { PriceList, DetailedPriceList, PriceListItem, ActionResponse } from "@/types";
import { assignProductsSchema } from "@/lib/validations/pricelist.schema";

// --- Price List Actions ---

export async function getPriceLists(): Promise<ActionResponse<PriceList[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from("price_lists")
            .select('*')
            .order("name", { ascending: true });
        if (error) throw error;
        return data || [];
    });
}

export async function getPriceListById(id: string): Promise<ActionResponse<DetailedPriceList>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from("price_lists")
            .select(`
                *,
                price_list_items (
                    *,
                    products ( * )
                )
            `)
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Price list not found.");

        const { data: agreements, error: agreementsError } = await supabase
            .from("agreements")
            .select("id")
            .eq("price_list_id", id);
        if (agreementsError) throw agreementsError;

        let availableBuyPromotions: DetailedPriceList["available_buy_x_promotions"] = [];
        const agreementIds = (agreements || []).map(agreement => agreement.id);
        if (agreementIds.length > 0) {
            const { data: agreementPromotionRows, error: agreementPromotionsError } = await supabase
                .from("agreement_promotions")
                .select("promotion_id")
                .in("agreement_id", agreementIds);
            if (agreementPromotionsError) throw agreementPromotionsError;

            const promotionIds = [...new Set((agreementPromotionRows || []).map(row => row.promotion_id))];
            if (promotionIds.length > 0) {
                const { data: promotions, error: promotionsError } = await supabase
                    .from("promotions")
                    .select("*")
                    .in("id", promotionIds)
                    .order("name", { ascending: true });
                if (promotionsError) throw promotionsError;
                availableBuyPromotions = (promotions || []).filter(
                    promotion => promotion.rules?.type === "buy_x_get_y_free"
                );
            }
        }

        const { data: assignments, error: assignmentsError } = await supabase
            .from("price_list_item_promotions")
            .select("product_id, promotion_id")
            .eq("price_list_id", id);
        if (assignmentsError) throw assignmentsError;

        const availablePromotionIds = new Set(availableBuyPromotions.map(promotion => promotion.id));
        const productPromotionIds = new Map<string, string[]>();
        for (const assignment of assignments || []) {
            if (!availablePromotionIds.has(assignment.promotion_id)) continue;
            const productIds = productPromotionIds.get(assignment.product_id) || [];
            productIds.push(assignment.promotion_id);
            productPromotionIds.set(assignment.product_id, productIds);
        }

        return {
            ...data,
            price_list_items: (data.price_list_items ?? []).map((item: PriceListItem) => ({
                ...item,
                assigned_promotion_ids: productPromotionIds.get(item.product_id) || [],
            })),
            available_buy_x_promotions: availableBuyPromotions,
        };
    });
}

type UpsertPriceListPayload = { name: string, prices_include_vat: boolean, id?: string };
export async function upsertPriceList(payload: UpsertPriceListPayload) {
  const result = await upsertEntity("price_lists", payload, [
    "/admin/commercial-settings",
    "/admin/agreements",
    "/admin/agreements/[id]",
    "/admin/clients",
  ]);
   if (result.error && result.error.code === '23505') { // Unique constraint violation
      return { success: false, error: { ...result.error, message: `El nombre '${payload.name}' ya existe.` } };
  }
  return result;
}

export async function deletePriceList(id: string) {
    return await deleteEntity("price_lists", id, [
        "/admin/commercial-settings",
        "/admin/agreements",
        "/admin/agreements/[id]",
        "/admin/clients",
    ]);
}

export async function getUnassignedProductsForPriceList(priceListId: string): Promise<ActionResponse<any[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data: assignedProductIds, error: assignedIdsError } = await supabase
            .from('price_list_items')
            .select('product_id')
            .eq('price_list_id', priceListId);

        if (assignedIdsError) throw assignedIdsError;

        const assignedIds = assignedProductIds.map(p => p.product_id);
        const query = supabase.from('products').select('*').order('name');
        if (assignedIds.length > 0) {
            query.not('id', 'in', `(${assignedIds.join(',')})`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    });
}

export async function assignProductsToPriceList(payload: {
    price_list_id: string;
    products: { product_id: string; price: number, volume_price: number | null }[];
}): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const validated = assignProductsSchema.parse(payload);
        const supabase = await getSupabaseClientWithAuth();
        const productsToInsert = validated.products.map(p => ({ ...p, price_list_id: validated.price_list_id }));
        const { error } = await supabase.from('price_list_items').insert(productsToInsert);
        if (error) throw error;
        return null;
    }, [`/admin/pricelists/${payload.price_list_id}`]);
}

export async function unassignProductFromPriceList(payload: { price_list_id: string; product_id: string; }): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { error } = await supabase.from('price_list_items')
            .delete()
            .eq('price_list_id', payload.price_list_id)
            .eq('product_id', payload.product_id);
        if (error) throw error;
        revalidatePath(`/admin/pricelists/${payload.price_list_id}`);
        return null;
    });
}

export async function updatePriceListItem(payload: { price_list_id: string; product_id: string; price: number; volume_price: number | null }): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { price_list_id, product_id, ...updateData } = payload;
        const { error } = await supabase.from('price_list_items')
            .update(updateData)
            .eq('price_list_id', price_list_id)
            .eq('product_id', product_id);
        if (error) throw error;
        revalidatePath(`/admin/pricelists/${price_list_id}`);
        return null;
    });
}

export async function setPriceListProductPromotion(payload: {
    price_list_id: string;
    product_id: string;
    promotion_id: string;
    assigned: boolean;
}): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data: priceListItem, error: itemError } = await supabase
            .from("price_list_items")
            .select("product_id")
            .eq("price_list_id", payload.price_list_id)
            .eq("product_id", payload.product_id)
            .maybeSingle();
        if (itemError) throw itemError;
        if (!priceListItem) throw new Error("El producto ya no pertenece a esta lista de precios.");

        if (payload.assigned) {
            const { data: agreements, error: agreementsError } = await supabase
                .from("agreements")
                .select("id")
                .eq("price_list_id", payload.price_list_id);
            if (agreementsError) throw agreementsError;
            const agreementIds = (agreements || []).map(agreement => agreement.id);
            if (agreementIds.length === 0) {
                throw new Error("Asigna esta lista de precios a un convenio antes de configurar sus promociones.");
            }

            const { data: assignedPromotions, error: assignedPromotionsError } = await supabase
                .from("agreement_promotions")
                .select("promotion_id")
                .in("agreement_id", agreementIds);
            if (assignedPromotionsError) throw assignedPromotionsError;
            const promotionIsAvailable = (assignedPromotions || []).some(
                row => row.promotion_id === payload.promotion_id
            );
            if (!promotionIsAvailable) {
                throw new Error("La promoción debe estar asignada primero a un convenio que use esta lista.");
            }

            const { data: promotion, error: promotionError } = await supabase
                .from("promotions")
                .select("rules")
                .eq("id", payload.promotion_id)
                .maybeSingle();
            if (promotionError) throw promotionError;
            if (promotion?.rules?.type !== "buy_x_get_y_free") {
                throw new Error("Solo se pueden asignar promociones de tipo compra X y lleva Y desde esta lista.");
            }

            const { error } = await supabase
                .from("price_list_item_promotions")
                .upsert({
                    price_list_id: payload.price_list_id,
                    product_id: payload.product_id,
                    promotion_id: payload.promotion_id,
                }, { onConflict: "price_list_id,product_id,promotion_id" });
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("price_list_item_promotions")
                .delete()
                .eq("price_list_id", payload.price_list_id)
                .eq("product_id", payload.product_id)
                .eq("promotion_id", payload.promotion_id);
            if (error) throw error;
        }

        return null;
    }, [`/admin/pricelists/${payload.price_list_id}`, "/admin/commercial-settings"]);
}
