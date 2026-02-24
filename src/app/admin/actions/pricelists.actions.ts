
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClientWithAuth, upsertEntity, deleteEntity } from "./_helpers";
import type { PriceList, DetailedPriceList } from "@/types";

// --- Price List Actions ---

export async function getPriceLists(): Promise<{ data: PriceList[] | null, error: any }> {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase
        .from("price_lists")
        .select('*')
        .order("name", { ascending: true });

    if (error) {
        console.error("getPriceLists error:", error.message);
        return { data: null, error };
    }
    return { data, error: null };
}

export async function getPriceListById(id: string): Promise<{ data: DetailedPriceList | null, error: any }> {
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
    if (error) {
        console.error("getPriceListById error:", error.message);
        return { data: null, error };
    }
    if (!data) {
        return { data: null, error: { message: "Price list not found." } };
    }
    const detailedPriceList: DetailedPriceList = {
        ...data,
        price_list_items: data.price_list_items ?? [],
    };
    return { data: detailedPriceList, error: null };
}

type UpsertPriceListPayload = { name: string, prices_include_vat: boolean, id?: string, base_price_list_id?: string, discount_percentage?: number };
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

export async function getUnassignedProductsForPriceList(priceListId: string) {
    const supabase = await getSupabaseClientWithAuth();
    const { data: assignedProductIds, error: assignedIdsError } = await supabase
        .from('price_list_items')
        .select('product_id')
        .eq('price_list_id', priceListId);

    if (assignedIdsError) {
      console.error("getUnassignedProductsForPriceList (assigned) error:", assignedIdsError.message);
      return { data: [], error: assignedIdsError };
    }

    const assignedIds = assignedProductIds.map(p => p.product_id);
    const query = supabase.from('products').select('*').order('name');
    if (assignedIds.length > 0) {
      query.not('id', 'in', `(${assignedIds.join(',')})`)
    }
    const { data, error } = await query;
    
    if (error) {
        console.error("getUnassignedProductsForPriceList (filtered) error:", error.message);
        throw error;
    }
    return { data, error };
}

export async function assignProductsToPriceList(payload: {
  price_list_id: string;
  products: { product_id: string; price: number, volume_price: number | null }[];
}) {
  const supabase = await getSupabaseClientWithAuth();
  const productsToInsert = payload.products.map(p => ({ ...p, price_list_id: payload.price_list_id }));
  const { error } = await supabase.from('price_list_items').insert(productsToInsert);

  if (error) {
    console.error("assignProductsToPriceList error:", error.message);
    return { error };
  }
  revalidatePath(`/admin/pricelists/${payload.price_list_id}`);
  return { error: null };
}

export async function unassignProductFromPriceList(payload: { price_list_id: string; product_id: string; }) {
    const supabase = await getSupabaseClientWithAuth();
    const { error } = await supabase.from('price_list_items')
        .delete()
        .eq('price_list_id', payload.price_list_id)
        .eq('product_id', payload.product_id);
    if (error) {
      console.error("unassignProductFromPriceList error:", error.message);
      return { error };
    }
    revalidatePath(`/admin/pricelists/${payload.price_list_id}`);
    return { error: null };
}

export async function updatePriceListItem(payload: { price_list_id: string; product_id: string; price: number; volume_price: number | null }) {
    const supabase = await getSupabaseClientWithAuth();
    const { price_list_id, product_id, ...updateData } = payload;
    const { error } = await supabase.from('price_list_items')
        .update(updateData)
        .eq('price_list_id', price_list_id)
        .eq('product_id', product_id);
    if (error) {
      console.error("updatePriceListItem error:", error.message);
      return { error };
    }
    revalidatePath(`/admin/pricelists/${price_list_id}`);
    return { error: null };
}
