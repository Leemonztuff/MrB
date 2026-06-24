
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { CartItem, AuthState, AppSettingsRow, ActionResponse } from '@/types';
import { handleAction } from '@/app/admin/actions/_helpers';
import { onboardingSchema } from '@/lib/validations/client.schema';
import { formatAddress, formatDeliveryWindow } from '@/lib/formatters';

export async function hasUsers(): Promise<boolean> {
    if (process.env.VERCEL_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
    if (!supabaseAdmin) return true;
    try {
        const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
        return (data?.users?.length ?? 0) > 0;
    } catch (err) {
        return true;
    }
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
        user_metadata: { role: 'super_admin' }
    });

    if (error) return { error: { message: error.message } };
    redirect('/login');
}

export async function logout() {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    redirect('/login');
}

export async function getOrderPageData(clientId: string): Promise<ActionResponse<any>> {
    return handleAction(async () => {
        const supabase = await createServerClient();

        // 1. Buscar el cliente por ID
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .maybeSingle();

        if (clientError || !client) throw new Error("Cliente inválido.");
        if (!client.agreement_id) throw new Error("Este cliente no tiene un convenio asignado.");

        // 2. Obtener el convenio del cliente con sus promociones y lista de precios
        const [agreementResult, settingsResult] = await Promise.all([
            supabase.from('agreements')
                .select('*, agreement_promotions(promotions(*)), price_lists(*)')
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
            productsByCategory,
            vatPercentage: settings.vat_percentage || 21,
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
        const supabase = await createServerClient();
        const finalClientId = (!payload.clientId || payload.clientId === 'generic') ? null : payload.clientId;
        const finalClientName = payload.clientName || "Cliente";

        let agreementId = null;
        let priceListId = null;
        if (finalClientId) {
            const { data: client } = await supabase
                .from('clients')
                .select('agreement_id, price_lists(id, prices_include_vat)')
                .eq('id', finalClientId)
                .maybeSingle();
            agreementId = client?.agreement_id || null;
            priceListId = (client as any)?.price_lists?.id || null;
        }

        let serverTotal = 0;
        const orderItems = [];

        for (const item of payload.cart) {
            let pricePerUnit = item.product.price;
            let volumePrice = item.product.volume_price;

            if (priceListId) {
                const { data: pli } = await supabase
                    .from('price_list_items')
                    .select('price, volume_price')
                    .eq('price_list_id', priceListId)
                    .eq('product_id', item.product.id)
                    .maybeSingle();
                if (pli) {
                    pricePerUnit = pli.price;
                    volumePrice = pli.volume_price;
                }
            }

            const effectivePrice = volumePrice != null && volumePrice > 0 && volumePrice < pricePerUnit
                ? volumePrice
                : pricePerUnit;
            serverTotal += effectivePrice * item.quantity;
            orderItems.push({
                product_id: item.product.id,
                quantity: item.quantity,
                price_per_unit: effectivePrice,
            });
        }

        serverTotal = Math.round(serverTotal * 100) / 100;
        if (Math.abs(serverTotal - payload.total) > 1) {
            throw new Error("El total del pedido no coincide. Por favor, recarga la página e intenta de nuevo.");
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                client_id: finalClientId,
                agreement_id: agreementId,
                total_amount: serverTotal,
                status: 'armado',
                client_name_cache: finalClientName,
                notes: payload.notes || null,
            })
            .select()
            .single();

        if (orderError || !order) throw new Error("Error al guardar pedido.");

        const itemsWithOrderId = orderItems.map(item => ({
            ...item,
            order_id: order.id,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(itemsWithOrderId);
        if (itemsError) throw itemsError;

        return { orderId: order.id };
    }, ['/admin']);
}

export async function submitOnboardingForm(payload: any): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await createServerClient();
        const validated = onboardingSchema.parse(payload);
        const { onboarding_token, ...data } = validated;

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
            status: 'pending_agreement'
        };

        const { error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('onboarding_token', onboarding_token);

        if (error) throw error;
        return null;
    }, ['/admin']);
}

export async function getOnboardingClient(token: string): Promise<ActionResponse<any>> {
    return handleAction(async () => {
        const supabase = await createServerClient();
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('onboarding_token', token)
            .maybeSingle();
        if (error) throw error;
        return data;
    });
}
