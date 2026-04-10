"use client";

import { z } from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertProduct } from "@/app/admin/actions/products.actions";
import type { FormConfig } from "../../_components/entity-dialog";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/types";

const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  category_id: z.string().optional(),
  image: z.any().optional(),
});

const getProductDefaultValues = (product?: any) => ({
  name: product?.name ?? "",
  description: product?.description ?? "",
  category_id: product?.category_id ?? "",
  image_url: product?.image_url ?? null,
  image: undefined,
});

const renderProductFields = (form: any, props: { categories?: Category[] } = {}) => {
  const currentImageUrl = form.watch("image_url");
  const categories = props.categories || [];

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
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoría</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

const handleUpsertProduct = async (payload: z.infer<typeof productSchema> & { id?: string; image_url?: string }) => {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  let finalImageUrl = payload.image_url ?? null;

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
      return { success: false, data: null, error: { message: `Error al subir la imagen: ${uploadError.message}` } };
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
  if (payload.category_id) formData.append('category_id', payload.category_id);
  if (finalImageUrl) formData.append('image_url', finalImageUrl);

  return upsertProduct(formData);
}

export const productFormConfig: FormConfig<typeof productSchema> = {
  entityName: "Producto",
  schema: productSchema,
  upsertAction: handleUpsertProduct,
  getDefaultValues: getProductDefaultValues,
  renderFields: renderProductFields,
};