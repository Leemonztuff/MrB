"use server";

import { z } from "zod";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { getSupabaseClientWithAuth } from "@/app/admin/actions/_helpers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppSettings } from "@/types";

const LOGO_SETTING_KEYS = ["logo_path", "logo_url"] as const;
const LOGO_BUCKET = "app_assets";

type AppSettingRow = {
  key: string;
  value: unknown;
  updated_at?: string;
};

function normalizeTextSetting(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeNumberSetting(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBooleanSetting(value: unknown): boolean {
  return value === true;
}

function extractStoredLogoPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value.trim();
  }

  try {
    const parsed = new URL(value);
    const publicMarker = `/storage/v1/object/public/${LOGO_BUCKET}/`;
    const signMarker = `/storage/v1/object/sign/${LOGO_BUCKET}/`;

    if (parsed.pathname.includes(publicMarker)) {
      return decodeURIComponent(parsed.pathname.split(publicMarker)[1] || "").trim() || null;
    }

    if (parsed.pathname.includes(signMarker)) {
      return decodeURIComponent(parsed.pathname.split(signMarker)[1] || "").trim() || null;
    }
  } catch {
    return null;
  }

  return null;
}

function buildLogoAppUrl(version?: string | null): string {
  const search = new URLSearchParams();
  if (version) {
    search.set("v", version);
  }

  const query = search.toString();
  return query ? `/api/branding/logo?${query}` : "/api/branding/logo";
}

async function getLogoSettingRecord(
  supabase: Awaited<ReturnType<typeof createServerClient>> | Awaited<ReturnType<typeof getSupabaseClientWithAuth>>
): Promise<{ path: string | null; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value, updated_at")
    .in("key", [...LOGO_SETTING_KEYS])
    .order("updated_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return { path: null, updatedAt: null };
  }

  const preferredRow =
    data.find((row: AppSettingRow) => row.key === "logo_path") ||
    data.find((row: AppSettingRow) => row.key === "logo_url") ||
    null;

  if (!preferredRow) {
    return { path: null, updatedAt: null };
  }

  return {
    path: extractStoredLogoPath(preferredRow.value),
    updatedAt: preferredRow.updated_at ?? null,
  };
}

async function removeStoredLogoIfPresent(path: string | null): Promise<void> {
  if (!path || !supabaseAdmin) return;

  const { error } = await supabaseAdmin.storage.from(LOGO_BUCKET).remove([path]);
  if (error) {
    console.error("removeStoredLogoIfPresent error:", error.message);
  }
}

export async function getSettings(): Promise<AppSettings> {
  noStore();

  const supabase = await getSupabaseClientWithAuth();
  const [{ data, error }, logoSetting] = await Promise.all([
    supabase.from("app_settings").select("key, value"),
    getLogoSettingRecord(supabase),
  ]);

  if (error) {
    console.error("getSettings error:", error.message);
    return {
      whatsapp_number: "",
      vat_percentage: 21,
      logo_url: null,
      enable_stock_management: false,
    };
  }

  const settingsMap = (data || []).reduce<Record<string, unknown>>((acc, row: AppSettingRow) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return {
    whatsapp_number: normalizeTextSetting(settingsMap.whatsapp_number),
    vat_percentage: normalizeNumberSetting(settingsMap.vat_percentage, 21),
    logo_url: logoSetting.path ? buildLogoAppUrl(logoSetting.updatedAt) : null,
    enable_stock_management: normalizeBooleanSetting(settingsMap.enable_stock_management),
  };
}

export async function getPublicWhatsappNumber(): Promise<string> {
  noStore();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "whatsapp_number")
    .single();

  if (error || !data) {
    console.error("getPublicWhatsappNumber error:", error?.message);
    return "";
  }

  return normalizeTextSetting(data.value);
}

export async function getPublicLogoUrl(): Promise<string | null> {
  noStore();

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("key, value, updated_at")
      .in("key", [...LOGO_SETTING_KEYS])
      .order("updated_at", { ascending: false });

    const rows = (data ?? []) as AppSettingRow[];

    if (!error && rows.length > 0) {
      const preferredRow =
        rows.find((row) => row.key === "logo_path") ||
        rows.find((row) => row.key === "logo_url") ||
        null;

      const logoPath = extractStoredLogoPath(preferredRow?.value);
      if (logoPath) {
        return buildLogoAppUrl(preferredRow?.updated_at ?? null);
      }
    } else if (error) {
      console.error("getPublicLogoUrl (admin) error:", error.message);
    }
  }

  const supabase = await createServerClient();
  const logoSetting = await getLogoSettingRecord(supabase);

  return logoSetting.path ? buildLogoAppUrl(logoSetting.updatedAt) : null;
}

const settingsSchema = z.object({
    whatsapp_number: z.string().regex(/^\+?[\d\s-]{8,20}$/, "WhatsApp inválido").optional(),
    vat_percentage: z.string().refine(v => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100, "IVA inválido").optional(),
    enable_stock_management: z.boolean().optional(),
});

export async function updateSettings(formData: FormData): Promise<{ error?: string }> {
    const supabase = await getSupabaseClientWithAuth();

    const rawData = {
        whatsapp_number: formData.get("whatsapp_number") as string,
        vat_percentage: formData.get("vat_percentage") as string,
        enable_stock_management: formData.get("enable_stock_management") === "true",
    };

    const validated = settingsSchema.parse(rawData);

    const settingsToUpsert = [
        { key: "whatsapp_number", value: validated.whatsapp_number ?? "" },
        { key: "vat_percentage", value: validated.vat_percentage ?? "21" },
        { key: "enable_stock_management", value: validated.enable_stock_management ?? false },
    ];

  const { error } = await supabase.from("app_settings").upsert(settingsToUpsert, { onConflict: "key" });

  if (error) {
    console.error("updateSettings error:", error.message);
    return { error: "No se pudo guardar la configuracion." };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/login");
  revalidatePath("/signup");

  return {};
}

export async function updateLogo(formData: FormData): Promise<{ error?: string; logoUrl?: string | null }> {
  const authSupabase = await getSupabaseClientWithAuth();
  const logoImage = formData.get("logo_image") as File | null;

  if (!logoImage || logoImage.size === 0) {
    return { error: "No se proporcionó ninguna imagen." };
  }

  if (!supabaseAdmin) {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY para gestionar el logo." };
  }

  const mimeType = logoImage.type || "";
  const extensionMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };

  const fileExt =
    extensionMap[mimeType] ||
    logoImage.name.split(".").pop()?.toLowerCase() ||
    "png";

  const currentLogo = await getLogoSettingRecord(authSupabase);
  const filePath = `branding/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(LOGO_BUCKET)
    .upload(filePath, logoImage, {
      cacheControl: "31536000",
      upsert: false,
      contentType: mimeType || undefined,
    });

  if (uploadError) {
    console.error("updateLogo upload error:", uploadError.message);
    return { error: "No se pudo subir el logo." };
  }

  const upsertRows = [
    { key: "logo_path", value: filePath },
    { key: "logo_url", value: filePath },
  ];

  const { error: dbError } = await authSupabase
    .from("app_settings")
    .upsert(upsertRows, { onConflict: "key" });

  if (dbError) {
    console.error("updateLogo db error:", dbError.message);
    await removeStoredLogoIfPresent(filePath);
    return { error: "No se pudo guardar la referencia del logo." };
  }

  if (currentLogo.path && currentLogo.path !== filePath) {
    await removeStoredLogoIfPresent(currentLogo.path);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/login");
  revalidatePath("/signup");
  revalidatePath("/portal", "layout");
  revalidatePath("/portal");
  revalidatePath("/onboarding/[token]", "page");
  revalidatePath("/pedido/[id]", "page");
  revalidatePath("/admin/imprimir/rotulos");

  const refreshVersion = new Date().toISOString();
  return { logoUrl: buildLogoAppUrl(refreshVersion) };
}

export async function deleteLogo(): Promise<{ error?: string }> {
  const authSupabase = await getSupabaseClientWithAuth();
  const currentLogo = await getLogoSettingRecord(authSupabase);

  await removeStoredLogoIfPresent(currentLogo.path);

  const { error } = await authSupabase
    .from("app_settings")
    .delete()
    .in("key", [...LOGO_SETTING_KEYS]);

  if (error) {
    console.error("deleteLogo error:", error.message);
    return { error: "No se pudo eliminar el logo." };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/login");
  revalidatePath("/signup");
  revalidatePath("/portal", "layout");
  revalidatePath("/portal");

  return {};
}
