import { z } from "zod";

export const priceListItemSchema = z.object({
  product_id: z.string().uuid(),
  // Se permite 0: al asignar productos a una lista se agregan con precio $0
  // y luego el admin los edita. Exigir >0 rompía esa asignación.
  price: z.number().min(0, "El precio no puede ser negativo"),
  volume_price: z.number().min(0, "El precio volumen no puede ser negativo").nullable(),
});

export const assignProductsSchema = z.object({
  price_list_id: z.string().uuid(),
  products: z.array(priceListItemSchema).min(1, "Debe asignar al menos un producto"),
});

export type PriceListItemInput = z.infer<typeof priceListItemSchema>;
export type AssignProductsInput = z.infer<typeof assignProductsSchema>;
