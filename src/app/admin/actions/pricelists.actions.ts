
"use server";

import { revalidatePath } from "next/cache";
import { handleAction, getSupabaseClientWithAuth, upsertEntity, deleteEntity } from "./_helpers";
import type { PriceList, DetailedPriceList, ActionResponse } from "@/types";
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
        return {
            ...data,
            price_list_items: data.price_list_items ?? [],
        };
    });
}

type UpsertPriceListPayload = { name: string, prices_include_vat: boolean, id?: string };
export async function upsertPriceList(payload: UpsertPriceListPayload) {
  const result = await upsertEntity("price_lists", payload, ["/admin/commercial-settings"]);
   if (result.error && result.error.code === '23505') { // Unique constraint violation
      return { data: null, error: { ...result.error, message: `El nombre '${payload.name}' ya existe.` } };
  }
  return result;
}

export async function deletePriceList(id: string) {
    return await deleteEntity("price_lists", id, ["/admin/commercial-settings"]);
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
            query.not('id', 'in', assignedIds);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    });
}

export async function assignProductsToPriceList(payload: {
    price_list_id: string;
    products: { product_id: string; price: number, volume_price: number | null }[];
}) {
    const validated = assignProductsSchema.parse(payload);
    const supabase = await getSupabaseClientWithAuth();
    const productsToInsert = validated.products.map(p => ({ ...p, price_list_id: validated.price_list_id }));
    const { error } = await supabase.from('price_list_items').insert(productsToInsert);
    if (error) throw error;
    revalidatePath(`/admin/pricelists/${validated.price_list_id}`);
    return null;
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
