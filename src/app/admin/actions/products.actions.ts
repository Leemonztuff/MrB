
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

export type ImportProductRow = {
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  imagen?: string;
};

export type ImportRowData = Record<string, any>;
export type ColumnMapping = {
  sourceColumn: string;
  targetField: string;
};

export async function importProducts(
  data: ImportRowData[],
  mappings: ColumnMapping[]
): Promise<ActionResponse<{ imported: number; updated: number; errors: { row: number; message: string }[] }>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const errors: { row: number; message: string }[] = [];
    let imported = 0;
    let updated = 0;

    const mappingMap = new Map(mappings.map(m => [m.sourceColumn, m.targetField]));

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const transformed: Record<string, any> = {};
        
        for (const [sourceCol, targetField] of mappingMap) {
          if (sourceCol && targetField && row[sourceCol] !== undefined) {
            let value = row[sourceCol];
            if (typeof value === 'string') {
              value = value.trim();
            }
            transformed[targetField] = value;
          }
        }

        if (!transformed.name || transformed.name === '') {
          errors.push({ row: i + 1, message: "Falta nombre del producto" });
          continue;
        }

        if (transformed.sku) {
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('name', transformed.name)
            .maybeSingle();

          if (existing) {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                description: transformed.description || null,
                category: transformed.category || null,
                image_url: transformed.image_url || null,
              })
              .eq('id', existing.id);

            if (updateError) {
              errors.push({ row: i + 1, message: updateError.message });
            } else {
              updated++;
            }
            continue;
          }
        }

        const { error: insertError } = await supabase
          .from('products')
          .insert({
            name: transformed.name,
            description: transformed.description || null,
            category: transformed.category || null,
            image_url: transformed.image_url || null,
          });

        if (insertError) {
          errors.push({ row: i + 1, message: insertError.message });
        } else {
          imported++;
        }
      } catch (err: any) {
        errors.push({ row: i + 1, message: err.message });
      }
    }

    return { imported, updated, errors };
  }, ['/admin/products']);
}

export async function importProductsLegacy(
  data: ImportProductRow[]
): Promise<ActionResponse<{ imported: number; errors: string[] }>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    
    const errors: string[] = [];
    let imported = 0;

    for (const row of data) {
      try {
        const productData = {
          name: (row.nombre || "").trim(),
          description: row.descripcion?.trim() || null,
          category: row.categoria?.trim() || null,
          image_url: row.imagen?.trim() || null,
        };

        if (!productData.name) {
          errors.push(`Producto sin nombre, omitido`);
          continue;
        }

        const { error: insertError } = await supabase
          .from('products')
          .insert(productData);

        if (insertError) {
          errors.push(`Error en "${productData.name}": ${insertError.message}`);
        } else {
          imported++;
        }
      } catch (err: any) {
        errors.push(`Error procesando: ${err.message}`);
      }
    }

    return { imported, errors };
  }, ['/admin/products']);
}
