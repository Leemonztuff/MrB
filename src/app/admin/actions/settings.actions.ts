
"use server";

import { getSupabaseClientWithAuth, handleAction } from "@/app/admin/actions/_helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { AppSettings } from "@/types";
import type { ActionResponse } from "@/types";

// Los flujos públicos corren del lado del servidor, por lo que usan el cliente
// con service_role (bypassa RLS). El service_role NUNCA se expone al navegador.
function requireAdmin() {
    if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
    return supabaseAdmin;
}

export async function getSettings(): Promise<AppSettings> {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase.from('app_settings').select('key, value');

    if (error) {
        console.error("getSettings error:", error.message);
        return { whatsapp_number: "", vat_percentage: 21, logo_url: null, label_logo_url: null };
    }

    const settings = (data || []).reduce((acc: any, { key, value }: { key: string, value: any }) => {
        acc[key] = key === 'vat_percentage' ? Number(value) : value;
        return acc;
    }, {} as AppSettings);

    return {
        whatsapp_number: settings.whatsapp_number || "",
        vat_percentage: settings.vat_percentage || 21,
        logo_url: settings.logo_url || null,
        label_logo_url: settings.label_logo_url || null,
    };
}

/**
 * Gets the WhatsApp number. This action is public and can be called from client components
 * without authentication. Runs server-side with the service_role client.
 */
export async function getPublicWhatsappNumber(): Promise<ActionResponse<string>> {
    return handleAction(async () => {
        const supabase = requireAdmin();
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'whatsapp_number')
            .single();
        if (error) throw error;
        return data.value;
    });
}

/**
 * Gets a public app setting by key. These actions are public and can be called from
 * server components without authentication. Runs server-side with the service_role client.
 */
async function getPublicSetting(key: string): Promise<ActionResponse<string | null>> {
    return handleAction(async () => {
        const supabase = requireAdmin();
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        if (error) throw error;
        return (data?.value ?? null) as string | null;
    });
}

/**
 * Gets the square brand icon URL (used across the app UI).
 */
export async function getPublicLogoUrl(): Promise<ActionResponse<string | null>> {
    return getPublicSetting('logo_url');
}

/**
 * Gets the wide logo URL used on the shipping labels (recommended 912x168).
 */
export async function getPublicLabelLogoUrl(): Promise<ActionResponse<string | null>> {
    return getPublicSetting('label_logo_url');
}




export async function updateSettings(formData: FormData): Promise<{ error?: string }> {
    const supabase = await getSupabaseClientWithAuth();

    const whatsapp_number = formData.get('whatsapp_number') as string;
    const vat_percentage = Number(formData.get('vat_percentage') as string);

    const settingsToUpsert = [
        { key: 'whatsapp_number', value: whatsapp_number },
        { key: 'vat_percentage', value: vat_percentage },
    ];

    const { error } = await supabase.from('app_settings').upsert(settingsToUpsert, { onConflict: 'key' });

    if (error) {
        console.error("updateSettings error:", error.message);
        return { error: "No se pudo guardar la configuración." };
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/login');
    revalidatePath('/signup');

    return {};
}

async function uploadLogoAsset(
    formData: FormData,
    {
        field,
        fileNameBase,
        settingKey,
    }: { field: string; fileNameBase: string; settingKey: string }
): Promise<{ error?: string }> {
    const supabase = await getSupabaseClientWithAuth();
    const logoImage = formData.get(field) as File | null;

    if (!logoImage || logoImage.size === 0) {
        return { error: "No se proporcionó ninguna imagen." };
    }

    const fileExt = logoImage.name.split('.').pop();
    const filePath = `public/${fileNameBase}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('app_assets')
        .upload(filePath, logoImage, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error("Logo upload error:", uploadError.message);
        return { error: "No se pudo subir el nuevo logo." };
    }

    const { data: publicUrlData } = supabase.storage.from('app_assets').getPublicUrl(filePath);
    const logoUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`; // Cache-busting

    const { error: dbError } = await supabase.from('app_settings').upsert(
        { key: settingKey, value: logoUrl },
        { onConflict: 'key' }
    );

    if (dbError) {
        console.error("updateLogo db error:", dbError.message);
        return { error: "No se pudo guardar la URL del logo." };
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/login');
    revalidatePath('/signup');
    return {};
}

async function deleteLogoAsset(settingKey: string): Promise<{ error?: string }> {
    const supabase = await getSupabaseClientWithAuth();

    const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('key', settingKey);

    if (error) {
        console.error("deleteLogo error:", error.message);
        return { error: "No se pudo eliminar el logo de la base de datos." };
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/login');
    revalidatePath('/signup');
    return {};
}

export async function updateLogo(formData: FormData): Promise<{ error?: string }> {
    return uploadLogoAsset(formData, {
        field: 'logo_image',
        fileNameBase: 'logo',
        settingKey: 'logo_url',
    });
}

export async function deleteLogo(): Promise<{ error?: string }> {
    return deleteLogoAsset('logo_url');
}

export async function updateLabelLogo(formData: FormData): Promise<{ error?: string }> {
    return uploadLogoAsset(formData, {
        field: 'label_logo_image',
        fileNameBase: 'label-logo',
        settingKey: 'label_logo_url',
    });
}

export async function deleteLabelLogo(): Promise<{ error?: string }> {
    return deleteLogoAsset('label_logo_url');
}
