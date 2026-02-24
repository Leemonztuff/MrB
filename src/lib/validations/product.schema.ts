
import { z } from "zod";

export const productSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "El nombre del producto debe tener al menos 2 caracteres"),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    image_url: z.string().url("URL de imagen inválida").optional().nullable().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;
