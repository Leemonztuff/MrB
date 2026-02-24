
"use server";

import { handleAction, getSupabaseClientWithAuth, upsertEntity, deleteEntity } from "./_helpers";
import type { Agreement, DetailedAgreement, AgreementWithCount, AgreementSalesCondition, ActionResponse } from "@/types";

// --- Agreement Actions ---

export async function getAgreements(): Promise<ActionResponse<AgreementWithCount[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from("agreements_with_counts")
            .select(`*, price_lists ( name )`)
            .order("agreement_name", { ascending: true });

        if (error) throw error;
        return data as AgreementWithCount[];
    });
}

export async function getAgreementById(id: string): Promise<ActionResponse<DetailedAgreement>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from("agreements")
            .select(`
                *,
                agreement_promotions ( promotions ( * ) ),
                agreement_sales_conditions ( sales_conditions ( * ) ),
                price_lists ( id, name, prices_include_vat ),
                clients ( id, contact_name )
            `)
            .eq("id", id)
            .single();

        if (error) throw error;

        const detailedAgreement: DetailedAgreement = {
            ...data,
            agreement_promotions: data.agreement_promotions ?? [],
            agreement_sales_conditions: data.agreement_sales_conditions ?? [],
            price_lists: data.price_lists,
            clients: data.clients ?? [],
        };
        return detailedAgreement;
    });
}

export async function getAgreementSalesConditions(agreementId: string): Promise<ActionResponse<AgreementSalesCondition[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from("agreement_sales_conditions")
            .select(`sales_conditions ( * )`)
            .eq("agreement_id", agreementId);

        if (error) throw error;
        return data as unknown as AgreementSalesCondition[];
    });
}

type UpsertAgreementPayload = Pick<Agreement, "agreement_name" | "client_type" | "price_list_id"> & {
    id?: string;
};

export async function upsertAgreement(payload: UpsertAgreementPayload): Promise<ActionResponse<Agreement>> {
    const result = await upsertEntity("agreements", payload, ["/admin/agreements", "/admin/clients"]);
    if (!result.success && result.error?.code === '23505') {
        return {
            success: false,
            error: {
                message: `Error: El nombre del convenio '${payload.agreement_name}' ya existe.`,
                code: '23505'
            }
        };
    }
    return result;
}

export async function deleteAgreement(id: string): Promise<ActionResponse<null>> {
    return await deleteEntity("agreements", id, ["/admin/agreements"]);
}

// --- Relationship Management ---

export async function getUnassignedPromotions(agreementId: string): Promise<ActionResponse<any[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data: assigned, error: assignedError } = await supabase
            .from('agreement_promotions')
            .select('promotion_id')
            .eq('agreement_id', agreementId);

        if (assignedError) throw assignedError;

        const assignedIds = assigned.map(p => p.promotion_id);
        const query = supabase.from('promotions').select('*').order('name');

        if (assignedIds.length > 0) {
            query.not('id', 'in', `(${assignedIds.join(',')})`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    });
}

export async function assignMultiplePromotionsToAgreement(payload: {
    agreement_id: string;
    promotion_ids: string[];
}): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const promotionsToInsert = payload.promotion_ids.map(promoId => ({
            agreement_id: payload.agreement_id,
            promotion_id: promoId,
        }));

        const { error } = await supabase.from('agreement_promotions').insert(promotionsToInsert);
        if (error) throw error;
        return null;
    }, [`/admin/agreements/${payload.agreement_id}`]);
}

export async function unassignPromotionFromAgreement(payload: { agreement_id: string; promotion_id: string; }): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { error } = await supabase.from('agreement_promotions')
            .delete()
            .eq('agreement_id', payload.agreement_id)
            .eq('promotion_id', payload.promotion_id);

        if (error) throw error;
        return null;
    }, [`/admin/agreements/${payload.agreement_id}`]);
}

export async function getUnassignedSalesConditions(agreementId: string): Promise<ActionResponse<any[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data: assigned, error: assignedError } = await supabase
            .from('agreement_sales_conditions')
            .select('sales_condition_id')
            .eq('agreement_id', agreementId);

        if (assignedError) throw assignedError;

        const assignedIds = assigned.map(item => item.sales_condition_id);
        const query = supabase.from('sales_conditions').select('*').order('name');

        if (assignedIds.length > 0) {
            query.not('id', 'in', `(${assignedIds.join(',')})`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    });
}

export async function assignMultipleSalesConditionsToAgreement(payload: {
    agreement_id: string;
    sales_condition_ids: string[];
}): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const conditionsToInsert = payload.sales_condition_ids.map(id => ({
            agreement_id: payload.agreement_id,
            sales_condition_id: id,
        }));

        const { error } = await supabase.from('agreement_sales_conditions').insert(conditionsToInsert);
        if (error) throw error;
        return null;
    }, [`/admin/agreements/${payload.agreement_id}`]);
}

export async function unassignSalesConditionFromAgreement(payload: { agreement_id: string; sales_condition_id: string; }): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { error } = await supabase.from('agreement_sales_conditions')
            .delete()
            .eq('agreement_id', payload.agreement_id)
            .eq('sales_condition_id', payload.sales_condition_id);

        if (error) throw error;
        return null;
    }, [`/admin/agreements/${payload.agreement_id}`]);
}
