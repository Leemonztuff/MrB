
"use server";

import { revalidatePath } from 'next/cache';
import { getSupabaseClientWithAuth, upsertEntity, handleAction } from './_helpers';
import type {
  Client,
  ClientStats,
  OrderWithItems,
  AnalyzeClientOutput,
  ActionResponse,
} from '@/types';
import { analyzeClientFlow } from '@/ai/flows/analyze-client-flow';
import { clientSchema } from '@/lib/validations/client.schema';
import { formatAddress, formatDeliveryWindow } from '@/lib/formatters';
import { supabaseAdmin } from '@/lib/supabase/admin';

// --- Client Actions ---

export async function getClients(
  query?: string
): Promise<ActionResponse<Client[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    let queryBuilder = supabase
      .from('clients')
      .select(`*, agreements ( agreement_name )`)
      .in('status', ['active', 'pending_agreement', 'pending_onboarding'])
      .order('created_at', { ascending: false });

    if (query) {
      const cleanedQuery = `%${query.replace(/\s/g, '%')}%`;
      queryBuilder = queryBuilder.or(
        `contact_name.ilike.${cleanedQuery},cuit.ilike.${cleanedQuery},address.ilike.${cleanedQuery}`
      );
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
  });
}

export async function getClientById(
  id: string
): Promise<ActionResponse<Client>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const { data: client, error } = await supabase
      .from('clients')
      .select(`*, agreements ( * )`)
      .eq('id', id)
      .single();

    if (error) throw error;
    return client;
  });
}

export async function createClientForInvitation(payload: { name: string | null; agreementId: string | null }): Promise<ActionResponse<Pick<Client, "id" | "onboarding_token">>> {
  const placeholderName = payload.name || `Cliente Pendiente - ${new Date().toISOString()}`;

  return await upsertEntity("clients", {
    status: 'pending_onboarding',
    onboarding_token: crypto.randomUUID(),
    contact_name: placeholderName,
    agreement_id: payload.agreementId,
  }, ["/admin/clients"]);
}

export async function upsertClient(
  payload: any // Input from form, will be validated or formatted
): Promise<ActionResponse<Client>> {
  return handleAction(async () => {
    const {
      id,
      street_address,
      street_number,
      locality,
      province,
      delivery_days,
      delivery_time_from,
      delivery_time_to,
      ...clientData
    } = payload;

    const address = formatAddress({ street_address, street_number, locality, province });
    const delivery_window = formatDeliveryWindow({ delivery_days, delivery_time_from, delivery_time_to });

    const finalPayload: any = {
      ...clientData,
      id: id || undefined,
    };

    if (address) finalPayload.address = address;
    if (delivery_window) finalPayload.delivery_window = delivery_window;

    if (!id) {
      finalPayload.status = clientData.agreement_id ? 'active' : 'pending_agreement';
      finalPayload.onboarding_token = crypto.randomUUID();
    }

    // Validation
    const validated = clientSchema.parse(finalPayload);

    const result = await upsertEntity('clients', validated, [
      '/admin/clients',
      id ? `/admin/clients/${id}` : '',
    ].filter(Boolean));

    if (!result.success) throw new Error(result.error?.message);
    return result.data;
  });
}

export async function assignAgreementToClient(payload: {
  clientId: string;
  agreementId: string | null;
}): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('status')
      .eq('id', payload.clientId)
      .single();

    if (clientError || !client) throw new Error('Cliente no encontrado.');

    let newStatus = client.status as Client['status'];
    if (client.status !== 'pending_onboarding') {
      newStatus = payload.agreementId ? 'active' : 'pending_agreement';
    }

    const { error } = await supabase
      .from('clients')
      .update({
        agreement_id: payload.agreementId,
        status: newStatus,
      })
      .eq('id', payload.clientId);

    if (error) throw error;
    return null;
  }, ['/admin/clients', `/admin/clients/${payload.clientId}`, '/admin']);
}

export async function deleteClient(id: string): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { error } = await supabase
      .from('clients')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw error;
    return null;
  }, ['/admin/clients']);
}

export async function getClientOrdersWithDetails(
  clientId: string
): Promise<ActionResponse<OrderWithItems[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items ( quantity, price_per_unit, products ( name, category ) )`)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  });
}

export async function getClientStats(
  clientId: string
): Promise<ActionResponse<ClientStats>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase
      .rpc('get_client_stats', { p_client_id: clientId })
      .single();

    if (error) throw error;
    return data as ClientStats;
  });
}

export async function analyzeClient(
  clientId: string
): Promise<ActionResponse<AnalyzeClientOutput>> {
  return handleAction(async () => {
    const [clientRes, ordersRes] = await Promise.all([
      getClientById(clientId),
      getClientOrdersWithDetails(clientId),
    ]);

    if (!clientRes.success || !clientRes.data) throw new Error('No se pudo encontrar al cliente.');
    if (!ordersRes.success) throw new Error('No se pudieron obtener los pedidos del cliente.');

    const client = clientRes.data;
    const orders = ordersRes.data ?? [];

    return await analyzeClientFlow({ client, orders });
  });
}

export async function geocodeAddressAndSave(clientId: string, address: string): Promise<ActionResponse<{ latitude: number, longitude: number }>> {
  return handleAction<{ latitude: number, longitude: number }>(async () => {
    if (!process.env.GOOGLE_MAPS_API_KEY) throw new Error('Google Maps API key not configured.');

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results[0]) throw new Error(`Geocoding failed: ${data.status}`);

    const { lat, lng } = data.results[0].geometry.location;

    if (!supabaseAdmin) throw new Error('Admin client not available for updating coordinates.');

    const { error: updateError } = await (supabaseAdmin.from('clients') as any)
      .update({ latitude: lat as number, longitude: lng as number })
      .eq('id', clientId);

    if (updateError) throw updateError;
    return { latitude: lat, longitude: lng };
  }, [`/admin/clients/${clientId}`]);
}
