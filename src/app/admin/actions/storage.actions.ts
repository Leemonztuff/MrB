"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getSupabaseClientWithAuth, handleAction } from "./_helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionResponse } from "@/types";

export type StorageImage = {
  bucket: string;
  path: string;
  name: string;
  url: string;
  updatedAt: string | null;
};

// `app_assets` es el bucket unificado (logos + imágenes de productos).
// `product_images` se mantiene para poder reutilizar imágenes legacy.
const IMAGE_BUCKETS = ["app_assets", "product_images"] as const;
const IMAGE_EXTENSION = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const MAX_DEPTH = 6;

async function collectImages(
  client: SupabaseClient,
  bucket: string,
  prefix: string,
  acc: StorageImage[],
  depth = 0
): Promise<void> {
  if (depth > MAX_DEPTH) return;

  const { data, error } = await client.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (error) throw error;

  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id === null) {
      await collectImages(client, bucket, path, acc, depth + 1);
      continue;
    }

    if (!IMAGE_EXTENSION.test(item.name)) continue;

    const { data: publicUrl } = client.storage.from(bucket).getPublicUrl(path);

    acc.push({
      bucket,
      path,
      name: item.name,
      url: publicUrl.publicUrl,
      updatedAt: item.updated_at ?? null,
    });
  }
}

export async function listStorageImages(): Promise<ActionResponse<StorageImage[]>> {
  return handleAction(async () => {
    const authedClient = await getSupabaseClientWithAuth();
    const client = supabaseAdmin ?? authedClient;

    const images: StorageImage[] = [];

    for (const bucket of IMAGE_BUCKETS) {
      try {
        await collectImages(client, bucket, "", images);
      } catch (error: any) {
        console.error(`No se pudo listar el bucket ${bucket}:`, error?.message);
      }
    }

    return images.sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });
  });
}

async function collectFilePaths(
  client: SupabaseClient,
  bucket: string,
  prefix: string,
  acc: string[],
  depth = 0
): Promise<void> {
  if (depth > MAX_DEPTH) return;

  const { data, error } = await client.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (error) throw error;

  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id === null) {
      await collectFilePaths(client, bucket, path, acc, depth + 1);
    } else {
      acc.push(path);
    }
  }
}

export type ImageMigrationResult = {
  copied: number;
  updatedProducts: number;
  skipped: number;
  errors: string[];
};

/**
 * Copia todas las imágenes de `product_images` a `app_assets` y actualiza
 * `products.image_url` a la nueva URL. No borra los archivos originales.
 */
export async function migrateProductImagesToAppAssets(): Promise<ActionResponse<ImageMigrationResult>> {
  return handleAction(async () => {
    await getSupabaseClientWithAuth();

    if (!supabaseAdmin) throw new Error("Supabase admin client no disponible.");
    const admin = supabaseAdmin;

    const result: ImageMigrationResult = {
      copied: 0,
      updatedProducts: 0,
      skipped: 0,
      errors: [],
    };

    const paths: string[] = [];
    await collectFilePaths(admin, "product_images", "", paths);

    const urlMap = new Map<string, string>();

    for (const path of paths) {
      const { data: oldUrlData } = admin.storage
        .from("product_images")
        .getPublicUrl(path);

      const { data: fileData, error: downloadError } = await admin.storage
        .from("product_images")
        .download(path);

      if (downloadError || !fileData) {
        result.errors.push(`No se pudo descargar "${path}".`);
        continue;
      }

      const { error: uploadError } = await admin.storage
        .from("app_assets")
        .upload(path, fileData, {
          upsert: true,
          contentType: fileData.type || undefined,
        });

      if (uploadError) {
        result.errors.push(`No se pudo copiar "${path}": ${uploadError.message}`);
        continue;
      }

      const { data: newUrlData } = admin.storage
        .from("app_assets")
        .getPublicUrl(path);

      urlMap.set(oldUrlData.publicUrl, newUrlData.publicUrl);
      result.copied++;
    }

    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, image_url")
      .not("image_url", "is", null);

    if (productsError) throw productsError;

    for (const product of products ?? []) {
      const currentUrl = product.image_url as string | null;
      if (!currentUrl) continue;

      const newUrl = urlMap.get(currentUrl);
      if (!newUrl) {
        if (currentUrl.includes("/product_images/")) result.skipped++;
        continue;
      }

      const { error: updateError } = await admin
        .from("products")
        .update({ image_url: newUrl })
        .eq("id", product.id);

      if (updateError) {
        result.errors.push(`No se pudo actualizar el producto ${product.id}.`);
        continue;
      }

      result.updatedProducts++;
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin");

    return result;
  });
}
