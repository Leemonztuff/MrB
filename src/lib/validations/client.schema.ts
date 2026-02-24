
import { z } from "zod";

export const clientSchema = z.object({
    id: z.string().uuid().optional(),
    contact_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    contact_dni: z.string().optional().nullable(),
    email: z.string().email("Email inválido").optional().nullable(),
    cuit: z.string().optional().nullable(),
    fiscal_status: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    delivery_window: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    agreement_id: z.string().uuid().optional().nullable(),
    status: z.enum(['pending_onboarding', 'pending_agreement', 'active', 'archived']).optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
});

export const onboardingSchema = z.object({
    contact_name: z.string().min(2, "Nombre requerido"),
    contact_dni: z.string().min(7, "DNI inválido"),
    email: z.string().email("Email inválido"),
    cuit: z.string().min(11, "CUIT debe tener 11 dígitos"),
    fiscal_status: z.string().min(1, "Estado fiscal requerido"),
    street_address: z.string().min(1, "Dirección requerida"),
    street_number: z.string().min(1, "Número requerido"),
    locality: z.string().min(1, "Localidad requerida"),
    province: z.string().min(1, "Provincia requerida"),
    delivery_days: z.array(z.string()).min(1, "Elegí al menos un día"),
    delivery_time_from: z.string().min(1, "Hora desde requerida"),
    delivery_time_to: z.string().min(1, "Hora hasta requerida"),
    instagram: z.string().optional(),
    onboarding_token: z.string().uuid(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
