
"use server";

import { getSupabaseClientWithAuth, upsertEntity, deleteEntity, handleAction } from "./_helpers";
import { productSchema } from "@/lib/validations/product.schema";
import { ActionResponse, Product } from "@/types";

// --- Product Actions ---

export async function getProducts(): Promise<ActionResponse<Product[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  });
}

export async function upsertProduct(formData: FormData): Promise<ActionResponse<Product>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const id = formData.get('id') as string | null;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const category = formData.get('category') as string | null;
    const imageFile = formData.get('image') as File | null;
    const image_url = formData.get('image_url') as string | null;

    let finalImageUrl = image_url;

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${id || crypto.randomUUID()}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw new Error("Error al subir la imagen.");

      const { data: publicUrlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      finalImageUrl = publicUrlData.publicUrl;
    }

    const productData = {
      id: id || undefined,
      name,
      description,
      category,
      image_url: finalImageUrl
    };

    // Validation
    const validated = productSchema.parse(productData);

    const result = await upsertEntity("products", validated, ["/admin/products", "/admin/pricelists"]);
    if (!result.success) throw new Error(result.error?.message);
    return result.data;
  });
}

export async function deleteProduct(id: string): Promise<ActionResponse<null>> {
  return await deleteEntity("products", id, ["/admin/products", "/admin/pricelists"]);
}
