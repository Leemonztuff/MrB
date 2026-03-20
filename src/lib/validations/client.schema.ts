import { z } from "zod";

export const clientSchema = z.object({
    id: z.string().uuid().optional(),
    contact_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    contact_dni: z.string().optional().nullable(),
    email: z.string().email("Email invalido").optional().nullable(),
    cuit: z.string().optional().nullable(),
    fiscal_status: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    delivery_window: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    agreement_id: z.string().uuid().optional().nullable(),
    status: z.enum(['pending_onboarding', 'pending_agreement', 'active', 'archived']).optional(),
    onboarding_token: z.string().uuid().optional().nullable(),
    onboarding_expires_at: z.string().optional().nullable(),
    portal_token: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
});

export const onboardingSchema = z.object({
    contact_name: z.string().min(2, "Nombre requerido"),
    contact_dni: z.string().min(7, "DNI invalido"),
    email: z.string().email("Email invalido"),
    cuit: z.string().min(11, "CUIT debe tener 11 digitos"),
    fiscal_status: z.string().min(1, "Estado fiscal requerido"),
    street_address: z.string().min(1, "Direccion requerida"),
    street_number: z.string().min(1, "Numero requerido"),
    locality: z.string().min(1, "Localidad requerida"),
    province: z.string().min(1, "Provincia requerida"),
    delivery_days: z.array(z.string()).min(1, "Elegi al menos un dia"),
    delivery_time_from: z.string().min(1, "Hora desde requerida"),
    delivery_time_to: z.string().min(1, "Hora hasta requerida"),
    instagram: z.string().optional(),
    onboarding_token: z.string().uuid(),
});

export const onboardingMinimalSchema = z.object({
    contact_name: z.string().min(2, "Nombre requerido"),
    phone: z.string().min(8, "Telefono invalido"),
    street_address: z.string().min(1, "Direccion requerida"),
    street_number: z.string().min(1, "Numero requerido"),
    locality: z.string().min(1, "Localidad requerida"),
    province: z.string().min(1, "Provincia requerida"),
    onboarding_token: z.string().uuid(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OnboardingMinimalInput = z.infer<typeof onboardingMinimalSchema>;
