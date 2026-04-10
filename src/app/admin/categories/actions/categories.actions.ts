"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, Category } from '@/types';

export async function getCategories(): Promise<ActionResponse<Category[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (e: any) {
    return { success: false, error: { message: e.message } };
  }
}

export async function getCategory(
  id: string
): Promise<ActionResponse<Category | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: { message: e.message } };
  }
}

type CreateInput = {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
};

export async function createCategory(
  input: CreateInput
): Promise<ActionResponse<Category>> {
  try {
    const supabase = await createClient();
    
    if (input.id) {
      const { data, error } = await supabase
        .from('product_categories')
        .update({
          name: input.name,
          description: input.description,
          icon: input.icon,
          color: input.color,
          sort_order: input.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      revalidatePath('/admin/categories');
      return { success: true, data };
    }
    
    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        slug: input.slug.toLowerCase().replace(/\s+/g, '-'),
        name: input.name,
        description: input.description,
        icon: input.icon,
        color: input.color ?? '#6366f1',
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/categories');
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: { message: e.message } };
  }
}

type UpdateInput = {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
};

export async function updateCategory(
  input: UpdateInput
): Promise<ActionResponse<Category>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_categories')
      .update({
        name: input.name,
        description: input.description,
        icon: input.icon,
        color: input.color,
        sort_order: input.sort_order,
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/categories');
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: { message: e.message } };
  }
}

export async function deleteCategory(
  id: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      throw new Error(
        `No se puede eliminar: hay ${count} productos usando esta categoría`
      );
    }

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/categories');
    return { success: true, data: { success: true } };
  } catch (e: any) {
    return { success: false, error: { message: e.message } };
  }
}