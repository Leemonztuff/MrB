
"use server";

import { getSupabaseClientWithAuth } from "@/app/admin/actions/_helpers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AppSettings } from "@/types";

export async function getSettings(): Promise<AppSettings> {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase.from('app_settings').select('key, value');

    if (error) {
        console.error("getSettings error:", error.message);
        return { whatsapp_number: "", vat_percentage: 21, logo_url: null };
    }

    const settings = (data || []).reduce((acc: any, { key, value }: { key: string, value: any }) => {
        acc[key] = key === 'vat_percentage' ? Number(value) : value;
        return acc;
    }, {} as AppSettings);

    return {
        whatsapp_number: settings.whatsapp_number || "",
        vat_percentage: settings.vat_percentage || 21,
        logo_url: settings.logo_url || null,
    };
}

/**
 * Gets the WhatsApp number. This action is public and can be called from client components
 * without authentication, as it uses an anonymous server client.
 */
export async function getPublicWhatsappNumber(): Promise<string> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .single();

    if (error || !data) {
        console.error("getPublicWhatsappNumber error:", error?.message);
        return "";
    }
    return data.value;
}

/**
 * Gets the Logo URL. This action is public and can be called from server components
 * without authentication, as it uses an anonymous server client.
 */
export async function getPublicLogoUrl(): Promise<string | null> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

    if (error || !data) {
        // This is not a critical error, so we don't log it.
        // It's normal for the logo not to be configured.
        return null;
    }
    return data.value as string | null;
}


export async function updateSettings(formData: FormData): Promise<{ error?: string }> {
    const supabase = await getSupabaseClientWithAuth();

    const whatsapp_number = formData.get('whatsapp_number') as string;
    const vat_percentage = formData.get('vat_percentage') as string;

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

export async function updateLogo(formData: FormData): Promise<{ error?: string }> {
    const supabase = await getSupabaseClientWithAuth();
    const logoImage = formData.get('logo_image') as File | null;

    if (!logoImage || logoImage.size === 0) {
        return { error: "No se proporcionó ninguna imagen." };
    }

    const fileExt = logoImage.name.split('.').pop();
    const fileName = `logo.${fileExt}`;
    const filePath = `public/${fileName}`;

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
        { key: 'logo_url', value: logoUrl },
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

export async function deleteLogo(): Promise<{ error?: string }> {
    const supabase = await getSupabaseClientWithAuth();

    const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('key', 'logo_url');

    if (error) {
        console.error("deleteLogo error:", error.message);
        return { error: "No se pudo eliminar el logo de la base de datos." };
    }

    // Optional: Also delete the file from storage if desired
    // For this app, we'll just remove the DB reference to keep it simple.

    revalidatePath('/admin', 'layout');
    revalidatePath('/login');
    revalidatePath('/signup');
    return {};
}
