
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

function hasMissingOnboardingExpiryColumn(error: unknown): boolean {
  return error instanceof Error && error.message.includes('onboarding_expires_at');
}

async function insertClientWithOptionalOnboardingExpiry(createData: Record<string, unknown>): Promise<ActionResponse<any>> {
  const result = await upsertEntity("clients", createData, ["/admin/clients"]);
  if (result.success || !hasMissingOnboardingExpiryColumn(result.error ? new Error(result.error.message) : null)) {
    return result;
  }

  const { onboarding_expires_at, ...fallbackData } = createData;
  return upsertEntity("clients", fallbackData, ["/admin/clients"]);
}

export async function getClients(
  query?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ActionResponse<{ clients: Client[]; total: number; page: number; pageSize: number; totalPages: number }>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();
    const from = (page - 1) * pageSize;

    let queryBuilder = supabase
      .from('clients')
      .select(`*, agreements ( agreement_name )`, { count: 'exact' })
      .in('status', ['active', 'pending_agreement', 'pending_onboarding'])
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (query) {
      const cleanedQuery = `%${query.replace(/\s/g, '%')}%`;
      queryBuilder = queryBuilder.or(
        `contact_name.ilike.${cleanedQuery},cuit.ilike.${cleanedQuery},address.ilike.${cleanedQuery}`
      );
    }

    const { data, error, count } = await queryBuilder;
    if (error) throw error;
    
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      clients: data || [],
      total,
      page,
      pageSize,
      totalPages,
    };
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
  const normalizedName = payload.name?.trim() || null;
  const placeholderName = normalizedName || `Cliente Pendiente - ${new Date().toISOString()}`;

  const createData: any = {
    status: 'pending_onboarding',
    onboarding_token: crypto.randomUUID(),
    onboarding_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    contact_name: placeholderName,
    agreement_id: payload.agreementId || null,
  };

  return await insertClientWithOptionalOnboardingExpiry(createData);
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
      contact_name: clientData.contact_name?.trim().toUpperCase(),
      email: clientData.email?.trim().toLowerCase() || null,
      phone: clientData.phone?.trim() || null,
      cuit: clientData.cuit?.replace(/[^0-9]/g, '') || null,
      contact_dni: clientData.contact_dni?.trim() || null,
      fiscal_status: clientData.fiscal_status?.trim() || null,
      instagram: clientData.instagram?.trim() || null,
    };

    if (address) finalPayload.address = address;
    if (delivery_window) finalPayload.delivery_window = delivery_window;

    if (finalPayload.agreement_id === '') {
      finalPayload.agreement_id = null;
    }

    if (!id) {
      finalPayload.onboarding_token = crypto.randomUUID();
      finalPayload.onboarding_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (finalPayload.cuit) {
      let existingPortalToken = null;
      if (id) {
        const supabase = await getSupabaseClientWithAuth();
        const { data: existingClient } = await supabase.from('clients').select('portal_token').eq('id', id).single();
        existingPortalToken = existingClient?.portal_token;
      }
      
      if (!existingPortalToken) {
        const cleanCuit = finalPayload.cuit;
        if (cleanCuit.length >= 6) {
          finalPayload.portal_token = cleanCuit.slice(0, 6);
        }
      }
    }

    finalPayload.status = finalPayload.agreement_id ? 'active' : 'pending_agreement';

    const validated = clientSchema.parse(finalPayload);

    let result = await upsertEntity('clients', validated, [
      '/admin/clients',
      id ? `/admin/clients/${id}` : '',
    ].filter(Boolean));

    if (!result.success && hasMissingOnboardingExpiryColumn(new Error(result.error?.message))) {
      const { onboarding_expires_at, ...fallbackPayload } = validated as Record<string, unknown>;
      result = await upsertEntity('clients', fallbackPayload, [
        '/admin/clients',
        id ? `/admin/clients/${id}` : '',
      ].filter(Boolean));
    }

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

export async function getPendingChanges(): Promise<ActionResponse<any[]>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const { data, error } = await supabase
      .from('pending_changes')
      .select('*, clients(contact_name, email, cuit)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  });
}

export async function approveChange(changeId: string): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const { data: change, error: fetchError } = await supabase
      .from('pending_changes')
      .select('*')
      .eq('id', changeId)
      .single();

    if (fetchError || !change) throw new Error('Cambio no encontrado');

    const { error: updateError } = await supabase
      .from('clients')
      .update({ [change.change_type]: change.new_value })
      .eq('id', change.client_id);

    if (updateError) throw updateError;

    const { error: statusError } = await supabase
      .from('pending_changes')
      .update({ status: 'approved', resolved_at: new Date().toISOString() })
      .eq('id', changeId);

    if (statusError) throw statusError;

    return null;
  }, ['/admin/clients']);
}

export async function rejectChange(changeId: string): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const { error } = await supabase
      .from('pending_changes')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', changeId);

    if (error) throw error;
    return null;
  }, ['/admin/clients']);
}

export type ImportClientRow = {
  nombre?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  cuit?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  contacto?: string;
  instagram?: string;
  categoria?: string;
};

export async function importClients(
  data: ImportClientRow[]
): Promise<ActionResponse<{ imported: number; errors: string[] }>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const errors: string[] = [];
    let imported = 0;

    for (const row of data) {
      try {
        const formattedAddress = formatAddress({
          street_address: row.direccion?.trim(),
          locality: row.localidad?.trim(),
          province: row.provincia?.trim(),
        }) || null;

        const clientData: any = {
          contact_name: row.nombre?.trim().toUpperCase() || null,
          email: row.email?.toLowerCase().trim() || null,
          phone: row.celular?.trim() || row.telefono?.trim() || null,
          address: formattedAddress,
          instagram: row.instagram?.trim() || null,
          contact_dni: row.contacto?.trim() || null,
          onboarding_token: crypto.randomUUID(),
          onboarding_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending_agreement',
        };

        if (row.cuit) {
          const cleanCuit = row.cuit.replace(/[^0-9]/g, '');
          if (cleanCuit.length >= 6) {
            clientData.cuit = cleanCuit;
            clientData.portal_token = cleanCuit.slice(0, 6);
          }
        }

        let { error: insertError } = await supabase
          .from('clients')
          .insert(clientData);

        if (insertError && hasMissingOnboardingExpiryColumn(insertError)) {
          const { onboarding_expires_at, ...fallbackData } = clientData;
          const fallbackResult = await supabase
            .from('clients')
            .insert(fallbackData);
          insertError = fallbackResult.error;
        }

        if (insertError) {
          errors.push(`Error en "${clientData.contact_name}": ${insertError.message}`);
        } else {
          imported++;
        }
      } catch (err: any) {
        errors.push(`Error procesando "${row.nombre || "Sin nombre"}": ${err.message}`);
      }
    }

    return { imported, errors };
  }, ['/admin/clients']);
}

export type ImportClientRowData = Record<string, any>;
export type ClientColumnMapping = {
  sourceColumn: string;
  targetField: string;
};

export async function importClientsWithMapping(
  data: ImportClientRowData[],
  mappings: ClientColumnMapping[]
): Promise<ActionResponse<{ imported: number; errors: { row: number; message: string }[] }>> {
  return handleAction(async () => {
    const supabase = await getSupabaseClientWithAuth();

    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    const mappingMap = new Map(mappings.map(m => [m.sourceColumn, m.targetField]));

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        const transformed: Record<string, any> = {};

        for (const [sourceCol, targetField] of mappingMap) {
          if (sourceCol && targetField && row[sourceCol] !== undefined) {
            let value = row[sourceCol];
            if (typeof value === 'string') {
              value = value.trim();
            }
            transformed[targetField] = value;
          }
        }

        if (!transformed.contact_name || transformed.contact_name === '') {
          errors.push({ row: i + 1, message: "Falta nombre del cliente" });
          continue;
        }

        let formattedAddress = transformed.address;
        if (!formattedAddress && (transformed.locality || transformed.province)) {
          formattedAddress = formatAddress({
            street_address: transformed.street_address,
            locality: transformed.locality,
            province: transformed.province,
          }) || null;
        }

        const clientData: any = {
          contact_name: transformed.contact_name?.toUpperCase() || null,
          email: transformed.email?.toLowerCase().trim() || null,
          phone: transformed.phone?.trim() || transformed.telefono?.trim() || null,
          address: formattedAddress,
          instagram: transformed.instagram?.trim() || null,
          contact_dni: transformed.contact_dni?.trim() || null,
          onboarding_token: crypto.randomUUID(),
          status: 'pending_agreement',
        };

        if (transformed.cuit) {
          const cleanCuit = String(transformed.cuit).replace(/[^0-9]/g, '');
          if (cleanCuit.length >= 6) {
            clientData.cuit = cleanCuit;
            clientData.portal_token = cleanCuit.slice(0, 6);
          }
        }

        if (transformed.delivery_window) {
          clientData.delivery_window = transformed.delivery_window;
        }

        let { error: insertError } = await supabase
          .from('clients')
          .insert(clientData);

        if (insertError && hasMissingOnboardingExpiryColumn(insertError)) {
          const { onboarding_expires_at, ...fallbackData } = clientData;
          const fallbackResult = await supabase
            .from('clients')
            .insert(fallbackData);
          insertError = fallbackResult.error;
        }

        if (insertError) {
          errors.push({ row: i + 1, message: insertError.message });
        } else {
          imported++;
        }
      } catch (err: any) {
        errors.push({ row: i + 1, message: err.message });
      }
    }

    return { imported, errors };
  }, ['/admin/clients']);
}
