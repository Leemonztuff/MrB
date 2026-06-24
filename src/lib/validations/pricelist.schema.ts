import { z } from "zod";

export const priceListItemSchema = z.object({
  product_id: z.string().uuid(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  volume_price: z.number().positive("El precio volumen debe ser mayor a 0").nullable(),
});

export const assignProductsSchema = z.object({
  price_list_id: z.string().uuid(),
  products: z.array(priceListItemSchema).min(1, "Debe asignar al menos un producto"),
});

export type PriceListItemInput = z.infer<typeof priceListItemSchema>;
export type AssignProductsInput = z.infer<typeof assignProductsSchema>;
