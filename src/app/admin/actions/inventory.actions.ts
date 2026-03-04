
'use server';

import { handleAction, getSupabaseClientWithAuth } from './_helpers';
import { ActionResponse } from '@/types';
import { InventoryMovement } from '@/domain/inventory/types';
import { calculateStockFromMovements, calculateBulkStock } from '@/domain/inventory/stock-engine';
import { revalidatePath } from 'next/cache';

/**
 * Record a new inventory movement.
 */
export async function createMovement(payload: {
    productId: string;
    type: 'in' | 'out' | 'adjustment' | 'reserved';
    quantity: number;
    reason?: string;
    referenceId?: string;
}): Promise<ActionResponse<InventoryMovement>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();

        const { data, error } = await supabase
            .from('inventory_movements')
            .insert({
                product_id: payload.productId,
                type: payload.type,
                quantity: payload.quantity,
                reason: payload.reason || null,
                reference_id: payload.referenceId || null
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/products');

        return data;
    });
}

/**
 * Get all movements for a specific product.
 */
export async function getProductMovements(productId: string): Promise<ActionResponse<InventoryMovement[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    });
}

/**
 * Get current stock levels for all products.
 */
export async function getAllProductsStock(): Promise<ActionResponse<Record<string, any>>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from('inventory_movements')
            .select('*');

        if (error) throw error;

        const stockMap = calculateBulkStock(data || []);
        return stockMap;
    });
}

/**
 * Helper to bulk record movements (e.g., when an order is placed).
 */
export async function recordBulkMovements(movements: {
    productId: string;
    type: 'in' | 'out' | 'adjustment' | 'reserved';
    quantity: number;
    reason?: string;
    referenceId?: string;
}[]): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();

        const payload = movements.map(m => ({
            product_id: m.productId,
            type: m.type,
            quantity: m.quantity,
            reason: m.reason || null,
            reference_id: m.referenceId || null
        }));

        const { error } = await supabase
            .from('inventory_movements')
            .insert(payload);

        if (error) throw error;

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/products');

        return null;
    });
}
