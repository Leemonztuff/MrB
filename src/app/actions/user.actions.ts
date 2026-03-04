
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { CartItem, AuthState, AppSettingsRow, ActionResponse } from '@/types';
import { handleAction } from '@/app/admin/actions/_helpers';
import { getPortalClient } from '@/app/actions/portal.actions';
import { onboardingSchema } from '@/lib/validations/client.schema';
import { formatAddress, formatDeliveryWindow } from '@/lib/formatters';

export async function hasUsers(): Promise<boolean> {
    if (process.env.VERCEL_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
    if (!supabaseAdmin) return true;
    try {
        const { data } = await supabaseAdmin.auth.admin.listUsers();
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

export async function getOrderPageData(agreementId: string, options?: { newsId?: string, promoId?: string }): Promise<ActionResponse<any>> {
    return handleAction(async () => {
        const supabase = await createServerClient();

        const [agreementResult, settingsResult, newsPromoResult] = await Promise.all([
            supabase.from('agreements').select('*, agreement_promotions(promotions(*)), agreement_sales_conditions(sales_conditions(*)), price_lists(*)').eq('id', agreementId).maybeSingle(),
            supabase.from('app_settings').select('key, value'),
            options?.newsId ? supabase.from('news').select('promotion_id, target_client_type').eq('id', options.newsId).single() : Promise.resolve({ data: null, error: null })
        ]);

        const { data: agreement, error: agreementError } = agreementResult;
        if (agreementError || !agreement) throw new Error("Convenio inválido.");

        let newsLinkedPromotion = null;
        if (options?.newsId && newsPromoResult.data) {
            const { promotion_id, target_client_type } = newsPromoResult.data;

            // Validate client type if targeted
            if (!target_client_type || target_client_type === agreement.client_type) {
                if (promotion_id) {
                    const { data: promo } = await supabase.from('promotions').select('*').eq('id', promotion_id).single();
                    if (promo) newsLinkedPromotion = promo;
                }
            }
        }

        if (!agreement.price_lists) throw new Error("Este convenio no tiene una lista de precios asignada.");

        const { data: priceListItems, error: itemsError } = await supabase
            .from('price_list_items')
            .select('price, volume_price, products(*)')
            .eq('price_list_id', agreement.price_lists.id);

        if (itemsError) throw new Error("Error al cargar productos.");

        let consumerPrices: Record<string, { price: number; volume_price: number | null }> = {};

        if (agreement.client_type === 'distribuidor') {
            const { data: barberiaAgreements } = await supabase
                .from('agreements')
                .select('price_lists(id, name)')
                .eq('client_type', 'barberia')
                .limit(1);

            if (barberiaAgreements && barberiaAgreements.length > 0) {
                const barberiaAgreement = barberiaAgreements[0] as any;
                const priceListData = barberiaAgreement.price_lists;
                const priceListId = Array.isArray(priceListData) ? priceListData[0]?.id : priceListData?.id;

                if (priceListId) {
                    const { data: consumerItems } = await supabase
                        .from('price_list_items')
                        .select('price, volume_price, product_id')
                        .eq('price_list_id', priceListId);

                    if (consumerItems) {
                        consumerItems.forEach((item: any) => {
                            consumerPrices[item.product_id] = {
                                price: item.price,
                                volume_price: item.volume_price
                            };
                        });
                    }
                }
            }
        }

        const products = priceListItems.map((pli: any) => {
            const product = Array.isArray(pli.products) ? pli.products[0] : pli.products;
            const consumerPrice = consumerPrices[product.id];
            return {
                ...product,
                price: pli.price,
                volume_price: pli.volume_price,
                consumer_price: consumerPrice?.price || null,
                consumer_volume_price: consumerPrice?.volume_price || null
            };
        }).filter(p => !!p).sort((a, b) => a.name.localeCompare(b.name));

        const productsByCategory = products.reduce((acc, p) => {
            const cat = p.category || 'Sin Categoría';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {} as Record<string, any[]>);

        const settings = (settingsResult.data || []).reduce((acc: any, s: AppSettingsRow) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        // SECURE IDENTITY ENFORCEMENT:
        // Try to get the definitively authenticated client session.
        const portalSession = await getPortalClient();
        let client = null;

        if (portalSession && portalSession.agreement_id === agreementId) {
            client = portalSession;
        } else {
            // Fallback for anonymous public links: try to find a generic client
            const { data } = await supabase.from('clients').select('*').eq('agreement_id', agreementId).limit(1).maybeSingle();
            client = data;
        }

        let productDurations: Record<string, number> = {};

        if (agreement.client_type === 'barberia' && client?.id) {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    created_at,
                    products(id)
                `)
                .eq('client_id', client.id)
                .order('created_at', { ascending: true });

            if (orderItems && orderItems.length > 0) {
                const productPurchaseDates: Record<string, string[]> = {};

                orderItems.forEach((item: any) => {
                    const productId = item.products?.id;
                    if (productId) {
                        if (!productPurchaseDates[productId]) {
                            productPurchaseDates[productId] = [];
                        }
                        productPurchaseDates[productId].push(item.created_at);
                    }
                });

                Object.entries(productPurchaseDates).forEach(([productId, dates]) => {
                    if (dates.length >= 2) {
                        let totalDays = 0;
                        let count = 0;
                        for (let i = 1; i < dates.length; i++) {
                            const prevDate = new Date(dates[i - 1]);
                            const currDate = new Date(dates[i]);
                            const diffTime = currDate.getTime() - prevDate.getTime();
                            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                            totalDays += diffDays;
                            count++;
                        }
                        if (count > 0) {
                            productDurations[productId] = Math.round(totalDays / count);
                        }
                    }
                });
            }
        }

        const promotions = (agreement.agreement_promotions || []).map((ap: any) => ap.promotions);
        if (newsLinkedPromotion) {
            promotions.push(newsLinkedPromotion);
        }

        const salesConditions = agreement.agreement_sales_conditions?.map((asc: any) => asc.sales_conditions).filter(Boolean) || [];

        return {
            agreement,
            client,
            productsByCategory,
            vatPercentage: settings.vat_percentage || 21,
            logoUrl: settings.logo_url,
            salesConditions,
            showProfitEstimation: agreement.client_type === 'distribuidor',
            showProductDuration: agreement.client_type === 'barberia',
            productDurations
        };
    });
}

export async function submitOrder(payload: {
    cart: CartItem[];
    total: number;
    agreementId: string;
    clientId: string;
    clientName: string;
    notes?: string;
}): Promise<ActionResponse<{ orderId: string }>> {
    return handleAction(async () => {
        const supabase = await createServerClient();
        // Safe access for clientId, defaulting to null if 'generic' or falsy
        const finalClientId = payload.clientId === 'generic' || !payload.clientId ? null : payload.clientId;
        // Safe access for clientName, defaulting to "Cliente" if falsy
        const finalClientName = payload.clientName || "Cliente";

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                client_id: finalClientId,
                agreement_id: payload.agreementId,
                total_amount: payload.total,
                status: 'armado',
                client_name_cache: finalClientName, // Using the safely accessed client name
                notes: payload.notes || null,
            })
            .select()
            .single();

        if (orderError || !order) throw new Error("Error al guardar pedido.");

        const orderItems = payload.cart.map(item => ({
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            price_per_unit: item.product.price,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        return { orderId: order.id };
    }, ['/admin']);
}

export async function submitOnboardingForm(payload: any): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await createServerClient();
        const validated = onboardingSchema.parse(payload);
        const { onboarding_token, ...data } = validated;

        // Check if token is expired before proceeding
        const { data: clientCheck } = await supabase
            .from('clients')
            .select('onboarding_expires_at, status')
            .eq('onboarding_token', onboarding_token)
            .single();

        if (clientCheck?.onboarding_expires_at && new Date(clientCheck.onboarding_expires_at) < new Date()) {
            throw new Error("El enlace de invitación ha expirado.");
        }

        const address = formatAddress(data);
        const delivery_window = formatDeliveryWindow(data);

        const clientBeforeUpdate = await supabase
            .from('clients')
            .select('agreement_id')
            .eq('onboarding_token', onboarding_token)
            .single();

        const newStatus = clientBeforeUpdate.data?.agreement_id ? 'active' : 'pending_agreement';

        const updateData: any = {
            contact_name: data.contact_name?.toUpperCase(),
            contact_dni: data.contact_dni,
            email: data.email,
            cuit: data.cuit,
            fiscal_status: data.fiscal_status,
            address,
            delivery_window,
            instagram: data.instagram,
            status: newStatus,
            onboarding_token: null // Invalidate token after use
        };

        if (data.cuit) {
            const cleanCuit = data.cuit.replace(/[^0-9]/g, '');
            if (cleanCuit.length >= 6) {
                updateData.portal_token = cleanCuit.slice(0, 6);
            }
        }

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
        if (!data) return null;

        // Check expiration
        if (data.onboarding_expires_at && new Date(data.onboarding_expires_at) < new Date()) {
            return null; // Treat expired as not found for security
        }

        return data;
    });
}
