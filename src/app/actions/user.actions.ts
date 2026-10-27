
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/env';
import type { CartItem, AuthState, AppSettingsRow, ActionResponse, Promotion } from '@/types';
import { handleAction } from '@/app/admin/actions/_helpers';
import { clearOperatorUnlockCookie } from '@/lib/operator-pin-server';
import { onboardingSchema } from '@/lib/validations/client.schema';
import { formatAddress, formatDeliveryWindow } from '@/lib/formatters';
import { calculateCartTotals, DEFAULT_VOLUME_THRESHOLD } from '@/lib/logic/cart-calculations';
import { buildOrderItems } from '@/lib/order-items';
import { scopePromotionsToPriceListProducts } from '@/lib/price-list-promotions';
import { z } from 'zod';

const cartQuantitySchema = z.number().int().positive().max(10000);
const operatorPasswordSchema = z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña no puede superar los 72 caracteres.");

// Los flujos públicos corren del lado del servidor, por lo que usan el cliente
// con service_role (bypassa RLS). El service_role NUNCA se expone al navegador.
function requireAdmin() {
    if (!supabaseAdmin) {
        throw new Error("Configuración del servidor incompleta.");
    }
    return supabaseAdmin;
}

export async function hasUsers(): Promise<boolean> {
    // Fallback: si falta configuración o el cliente admin no está disponible,
    // asumimos que no hay usuarios para que el flujo de creación sea alcanzable
    // (el middleware ya redirige a /setup cuando falta configuración).
    if (!isSupabaseConfigured() || !supabaseAdmin) return false;
    try {
        const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
        return (data?.users?.length ?? 0) > 0;
    } catch (err) {
        // Ante un error real de consulta, mantenemos el comportamiento
        // conservador: no exponer el registro si ya podría existir un admin.
        return true;
    }
}

export async function updateOperatorPassword(password: string): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await createServerClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user || user.app_metadata?.role !== 'operario') {
            throw new Error("Esta opción está disponible únicamente para cuentas de operario.");
        }

        const validatedPassword = operatorPasswordSchema.parse(password);
        const admin = requireAdmin();
        const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
            password: validatedPassword,
            email_confirm: true,
            app_metadata: { ...user.app_metadata, role: 'operario', pending_activation: false },
        });
        if (updateError) throw updateError;

        revalidatePath('/admin/settings');
        return null;
    });
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const supabase = await createServerClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    if (!email || !password) return { error: { message: 'Requeridos.' } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: { message: 'Error de acceso.' } };
    revalidatePath('/admin');
    redirect('/admin');
}

export async function signupSuperAdmin(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) return { error: { message: 'Email y contraseña requeridos.' } };
    if (!supabaseAdmin) return { error: { message: 'Error de configuración del servidor.' } };

    const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        // El rol de autorización va en app_metadata (solo lo escribe el server).
        // user_metadata es editable por el propio usuario, por eso no se usa para permisos.
        app_metadata: { role: 'super_admin' }
    });

    if (error) return { error: { message: error.message } };
    redirect('/login');
}

export async function logout() {
    await clearOperatorUnlockCookie();
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    redirect('/login');
}

export async function getOrderPageData(token: string): Promise<ActionResponse<any>> {
    return handleAction(async () => {
        const supabase = requireAdmin();

        // 1. Buscar el cliente por su token de pedido (no por id)
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('order_token', token)
            .maybeSingle();

        if (clientError || !client) throw new Error("Cliente inválido.");

        // 2. Verificar estado del cliente
        if (client.status === 'pending_onboarding') {
            throw new Error("Tu cuenta está pendiente de completar el formulario de datos. Por favor, completá tu información para poder hacer pedidos.");
        }
        if (client.status === 'pending_agreement') {
            throw new Error("Tu cuenta está pendiente de asignación de convenio. Un administrador está configurando tus precios y condiciones especiales. Pronto podrás hacer pedidos.");
        }
        if (client.status === 'archived') {
            throw new Error("Tu cuenta ha sido desactivada. Contactá al administrador para más información.");
        }
        if (!client.agreement_id) {
            throw new Error("Tu cuenta no tiene un convenio asignado. Contactá al administrador para que te asigne uno con tus precios especiales.");
        }

        // 2. Obtener el convenio del cliente con sus promociones y lista de precios
        const [agreementResult, settingsResult] = await Promise.all([
            supabase.from('agreements')
                .select('*, agreement_promotions(promotions(*)), agreement_sales_conditions(sales_conditions(*)), price_lists(*)')
                .eq('id', client.agreement_id)
                .maybeSingle(),
            supabase.from('app_settings').select('key, value')
        ]);

        const { data: agreement, error: agreementError } = agreementResult;
        if (agreementError || !agreement) throw new Error("Convenio inválido.");

        if (!agreement.price_lists) throw new Error("Este convenio no tiene una lista de precios asignada.");

        // 3. Obtener productos con precios de la lista del convenio
        const { data: priceListItems, error: itemsError } = await supabase
            .from('price_list_items')
            .select('price, volume_price, products(*)')
            .eq('price_list_id', agreement.price_lists.id);

        if (itemsError) throw new Error("Error al cargar productos.");

        const { data: promotionAssignments, error: promotionAssignmentsError } = await supabase
            .from('price_list_item_promotions')
            .select('product_id, promotion_id')
            .eq('price_list_id', agreement.price_lists.id);

        if (promotionAssignmentsError) throw new Error("Error al cargar promociones por producto.");

        const agreementPromotions = (agreement.agreement_promotions || [])
            .map((item: any) => item.promotions)
            .filter(Boolean);
        const promotions = scopePromotionsToPriceListProducts(
            agreementPromotions,
            promotionAssignments || []
        );

        const products = priceListItems.map((pli: any) => {
            const product = Array.isArray(pli.products) ? pli.products[0] : pli.products;
            return { ...product, price: pli.price, volume_price: pli.volume_price };
        }).filter(p => !!p).sort((a, b) => a.name.localeCompare(b.name));

        const productsByCategory = products.reduce((acc, p) => {
            const cat = p.category || 'Sin Categoría';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {} as Record<string, any[]>);

        // 4. Obtener configuración de la app (IVA, logo)
        const settings = (settingsResult.data || []).reduce((acc: any, s: AppSettingsRow) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        return {
            agreement,
            client,
            promotions,
            productsByCategory,
            validProductIds: products.map((p: any) => p.id),
            vatPercentage: settings.vat_percentage || 21,
            volumeThreshold: Number(settings.volume_threshold) || DEFAULT_VOLUME_THRESHOLD,
            logoUrl: settings.logo_url
        };
    });
}

export async function submitOrder(payload: {
    cart: CartItem[];
    total: number;
    clientId: string;
    clientName: string;
    notes?: string;
}): Promise<ActionResponse<{ orderId: string }>> {
    return handleAction(async () => {
        const supabase = requireAdmin();
        const finalClientId = (!payload.clientId || payload.clientId === 'generic') ? null : payload.clientId;
        const finalClientName = payload.clientName || "Cliente";

        // Validación defensiva: el carrito y las cantidades vienen del cliente.
        if (!Array.isArray(payload.cart) || payload.cart.length === 0) {
            throw new Error("El carrito está vacío.");
        }
        for (const item of payload.cart) {
            if (!item?.product?.id || !cartQuantitySchema.safeParse(item.quantity).success) {
                throw new Error("El pedido contiene productos o cantidades inválidas.");
            }
        }

        let agreementId: string | null = null;
        let priceListId: string | null = null;
        let pricesIncludeVat = true;
        let promotions: Promotion[] = [];
        let vatPercentage = 21;
        let volumeThreshold = DEFAULT_VOLUME_THRESHOLD;

        const { data: settingsRows } = await supabase
            .from('app_settings')
            .select('key, value');
        const vatRow = (settingsRows || []).find((s: AppSettingsRow) => s.key === 'vat_percentage');
        if (vatRow && vatRow.value != null) {
            vatPercentage = Number(vatRow.value) || 21;
        }
        const volumeRow = (settingsRows || []).find((s: AppSettingsRow) => s.key === 'volume_threshold');
        if (volumeRow && volumeRow.value != null) {
            volumeThreshold = Number(volumeRow.value) || DEFAULT_VOLUME_THRESHOLD;
        }

        if (finalClientId) {
            const { data: client } = await supabase
                .from('clients')
                .select('agreement_id')
                .eq('id', finalClientId)
                .maybeSingle();
            agreementId = client?.agreement_id || null;
        }

        if (agreementId) {
            const { data: agreement } = await supabase
                .from('agreements')
                .select('price_list_id, price_lists(id, prices_include_vat), agreement_promotions(promotions(*))')
                .eq('id', agreementId)
                .maybeSingle();
            priceListId = (agreement as any)?.price_lists?.id ?? (agreement as any)?.price_list_id ?? null;
            pricesIncludeVat = (agreement as any)?.price_lists?.prices_include_vat ?? true;
            promotions = ((agreement as any)?.agreement_promotions || [])
                .map((ap: any) => ap.promotions)
                .filter(Boolean);
        }

        if (priceListId && promotions.length > 0) {
            const { data: promotionAssignments, error: promotionAssignmentsError } = await supabase
                .from('price_list_item_promotions')
                .select('product_id, promotion_id')
                .eq('price_list_id', priceListId);

            if (promotionAssignmentsError) {
                throw new Error("No se pudieron validar las promociones del convenio. Intenta nuevamente.");
            }

            promotions = scopePromotionsToPriceListProducts(
                promotions,
                promotionAssignments || []
            );
        } else {
            promotions = scopePromotionsToPriceListProducts(promotions, []);
        }

        // Reconstruimos los items con precios autoritativos de la base de datos.
        // Una sola consulta para toda la lista (evita el N+1 por producto).
        const priceByProduct = new Map<string, { price: number; volume_price: number | null }>();

        if (priceListId) {
            const productIds = payload.cart.map((item) => item.product.id);
            const { data: pliRows, error: pliError } = await supabase
                .from('price_list_items')
                .select('product_id, price, volume_price')
                .eq('price_list_id', priceListId)
                .in('product_id', productIds);

            if (pliError) throw pliError;

            for (const row of pliRows ?? []) {
                priceByProduct.set(row.product_id, { price: row.price, volume_price: row.volume_price });
            }
        }

        const items: CartItem[] = payload.cart.map((item) => {
            const override = priceByProduct.get(item.product.id);
            return {
                product: {
                    ...item.product,
                    price: override ? override.price : item.product.price,
                    volume_price: override ? override.volume_price : item.product.volume_price,
                },
                quantity: item.quantity,
            };
        });

        // Usamos exactamente la misma lógica de cálculo que el cliente para que
        // el total coincida (IVA, umbral de volumen y promociones incluidos).
        const totals = calculateCartTotals(
            items,
            pricesIncludeVat,
            promotions,
            vatPercentage,
            volumeThreshold
        );
        const serverTotal = totals.totalPrice;

        // Defensa contra NaN/Infinity: un total inválido pasaría el chequeo de
        // tolerancia (NaN > 1 es false) y terminaría en un error críptico de la DB.
        if (!Number.isFinite(serverTotal) || !Number.isFinite(payload.total)) {
            throw new Error("No pudimos calcular el total del pedido. Recargá la página e intenta nuevamente.");
        }

        if (Math.abs(serverTotal - payload.total) > 1) {
            throw new Error("El total del pedido no coincide. Por favor, recarga la página e intenta de nuevo.");
        }

        const orderItems = buildOrderItems(items, totals.bonusInfo, totals.isVolumePricingActive);

        if (orderItems.some(oi => !oi.product_id || !Number.isFinite(oi.quantity) || !Number.isFinite(oi.price_per_unit))) {
            throw new Error("El pedido contiene productos con precios inválidos. Recargá la página e intenta nuevamente.");
        }

        const { data: order, error: orderError } = await supabase.rpc('create_order_with_items', {
            p_client_id: finalClientId,
            p_agreement_id: agreementId,
            p_total_amount: serverTotal,
            p_client_name_cache: finalClientName,
            p_notes: payload.notes || null,
            p_payment_type: null,
            p_items: orderItems,
        });

        if (orderError) {
            console.error('create_order_with_items error:', {
                message: orderError.message,
                code: (orderError as any).code,
                details: (orderError as any).details,
                hint: (orderError as any).hint,
            });

            const raw = `${orderError.message || ''}`.toLowerCase();

            if (raw.includes('foreign key')) {
                throw new Error("Alguno de los productos o datos del pedido ya no está disponible. Recargá la página e intenta nuevamente.");
            }
            if (raw.includes('null value') || raw.includes('not-null')) {
                throw new Error("El pedido quedó incompleto al guardarse. Recargá la página e intenta nuevamente.");
            }
            throw new Error("No se pudo guardar el pedido. Por favor, recargá la página e intenta nuevamente.");
        }

        if (!order) throw new Error("No se pudo guardar el pedido. Por favor, recargá la página e intenta nuevamente.");

        return { orderId: (order as { id: string }).id };
    }, ['/admin']);
}

export async function submitOnboardingForm(
    payload: any
): Promise<ActionResponse<{ status: 'active' | 'pending_agreement' }>> {
    return handleAction(async () => {
        const supabase = requireAdmin();
        const validated = onboardingSchema.parse(payload);
        const { onboarding_token, ...data } = validated;

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('agreement_id, status')
            .eq('onboarding_token', onboarding_token)
            .maybeSingle();

        if (clientError) throw clientError;
        if (!client || client.status !== 'pending_onboarding') {
            throw new Error("El enlace de alta ya fue utilizado o no es válido.");
        }

        const address = formatAddress(data);
        const delivery_window = formatDeliveryWindow(data);

        const updateData = {
            contact_name: data.contact_name,
            contact_dni: data.contact_dni,
            email: data.email,
            cuit: data.cuit,
            fiscal_status: data.fiscal_status,
            address,
            delivery_window,
            instagram: data.instagram,
            status: client.agreement_id ? 'active' as const : 'pending_agreement' as const,
        };

        const { data: updatedClient, error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('onboarding_token', onboarding_token)
            .eq('status', 'pending_onboarding')
            .select('status')
            .maybeSingle();

        if (error) throw error;
        if (!updatedClient) {
            throw new Error("El estado del cliente cambió. Actualizá la página e intentá nuevamente.");
        }
        return { status: updatedClient.status };
    }, ['/admin']);
}

export async function getOnboardingClient(token: string): Promise<ActionResponse<any>> {
    return handleAction(async () => {
        const supabase = requireAdmin();
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('onboarding_token', token)
            .maybeSingle();
        if (error) throw error;
        return data;
    });
}
