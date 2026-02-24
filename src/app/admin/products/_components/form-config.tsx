
"use client";

import { z } from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertProduct } from "@/app/admin/actions/products.actions";
import type { FormConfig } from "../../_components/entity-dialog";
import Image from "next/image";
import { Label } from "@/components/ui/label";

// 1. Esquema de validación para Producto
const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  category: z.string().optional(),
  image: z.any().optional(),
});

// 2. Función para obtener los valores por defecto del formulario de Producto
const getProductDefaultValues = (product?: any) => ({
  name: product?.name ?? "",
  description: product?.description ?? "",
  category: product?.category ?? "",
  image_url: product?.image_url ?? null,
  image: undefined,
});

// 3. Función para renderizar los campos del formulario de Producto
const renderProductFields = (form: any) => {
  const currentImageUrl = form.watch("image_url");

  return (
    <>
      <FormField
        control={form.control}
        name="image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Imagen del Producto</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
              />
            </FormControl>
            <FormDescription>
              Sube una imagen para el producto (recomendado: formato cuadrado).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {currentImageUrl && (
        <div className="space-y-2">
          <Label>Imagen Actual</Label>
          <div className="relative w-24 h-24">
            <Image
              src={currentImageUrl}
              alt="Imagen actual del producto"
              fill
              className="rounded-md object-cover"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sube una nueva imagen para reemplazar la actual.
          </p>
        </div>
      )}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del Producto</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Cera Modeladora" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea placeholder="Detalles del producto..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoría</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Ceras, Shampoos" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
};


// Wrapper action: uploads image client-side to Supabase Storage first,
// then sends only the URL string to the Server Action (avoids 1MB body limit).
const handleUpsertProduct = async (payload: z.infer<typeof productSchema> & { id?: string; image_url?: string }) => {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  let finalImageUrl = payload.image_url ?? null;

  // If there's a File object, upload it client-side first
  if (payload.image instanceof File && payload.image.size > 0) {
    const imageFile = payload.image;
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${payload.id || crypto.randomUUID()}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      console.error('Client-side image upload error:', uploadError.message);
      return { data: null, error: { message: `Error al subir la imagen: ${uploadError.message}` } };
    }

    const { data: publicUrlData } = supabase.storage
      .from('product_images')
      .getPublicUrl(filePath);

    finalImageUrl = publicUrlData.publicUrl;
  }

  const formData = new FormData();
  if (payload.id) formData.append('id', payload.id);
  formData.append('name', payload.name);
  if (payload.description) formData.append('description', payload.description);
  if (payload.category) formData.append('category', payload.category);
  if (finalImageUrl) formData.append('image_url', finalImageUrl);
  // Do NOT append the image File — it's already uploaded above

  return upsertProduct(formData);
}

// 4. Configuración completa para el formulario de Producto
export const productFormConfig: FormConfig<typeof productSchema> = {
  entityName: "Producto",
  schema: productSchema,
  upsertAction: handleUpsertProduct,
  getDefaultValues: getProductDefaultValues,
  renderFields: renderProductFields,
};
