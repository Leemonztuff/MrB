
"use client";

import Link from 'next/link';
import { useTransition, useCallback, useEffect, useState } from "react";
import { Info, Landmark, ArrowLeft, Edit, FilePen, Sparkles, MapPin, Calendar, Instagram, Mail, Fingerprint } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientHeader } from "./client-header";
import { ClientInfo } from "./client-info";
import { ClientStats } from "./client-stats";
import { ClientOrders } from "./client-orders";
import { ClientAnalysis } from './client-analysis';
import type { Client, ClientStats as StatsType, Order, AgreementSalesCondition } from "@/types";
import { Skeleton } from '@/components/ui/skeleton';
import { getAgreementSalesConditions } from "@/app/admin/actions/agreements.actions";
import { useToast } from "@/hooks/use-toast";
import { AssignAgreementDialog } from '../../_components/assign-agreement-dialog';
import { ActionButton, ActionButtonWrapper } from './client-action-buttons';
import { UpsertClientDialog } from '../../_components/upsert-client-dialog';
import { deleteClient } from '@/app/admin/actions/clients.actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const formatRule = (rules: any): string => {
  if (!rules || typeof rules !== 'object') return 'Regla no definida';
  const { type, days, percentage, installments, initial_percentage, remaining_days } = rules;
  switch (type) {
    case 'net_days': return `Plazo: ${days || 'N/D'} días netos.`;
    case 'discount': return `Descuento pronto pago: ${percentage || 'N/D'}%.`;
    case 'installments': return `Financiación: ${installments || 'N/D'} cuotas.`;
    case 'split_payment': return `${initial_percentage || 'N/D'}% adelanto, resto ${remaining_days || 'N/D'} días.`;
    default: return 'Regla personalizada.';
  }
};

export default function ClientDetailsClient({ client: initialClient, stats, orders }: { client: Client, stats: StatsType | null, orders: Order[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [client, setClient] = useState(initialClient);
  const [salesConditions, setSalesConditions] = useState<AgreementSalesCondition[]>([]);
  const [isLoadingConditions, setIsLoadingConditions] = useState(true);
  const [orderLink, setOrderLink] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && client.agreement_id && client.status === 'active') {
      setOrderLink(`${window.location.origin}/pedido/${client.agreement_id}`);
    }
  }, [client.agreement_id, client.status]);
  
  useEffect(() => { setClient(initialClient); }, [initialClient]);

  useEffect(() => {
    if (client.agreement_id) {
      setIsLoadingConditions(true);
      getAgreementSalesConditions(client.agreement_id)
        .then(({ data }) => setSalesConditions(data || []))
        .finally(() => setIsLoadingConditions(false));
    } else {
      setSalesConditions([]);
      setIsLoadingConditions(false);
    }
  }, [client.agreement_id]);

  const copyToClipboard = useCallback((textToCopy: string | null, toastMessage: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({ title: toastMessage });
  }, [toast]);

  const handleArchive = () => {
    startTransition(async () => {
      const result = await deleteClient(client.id);
      if (result.error) toast({ title: "Error", description: result.error.message, variant: "destructive" });
      else toast({ title: "Éxito", description: "Cliente archivado correctamente." });
    });
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 pb-20">
      <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
                <Link href="/admin/clients">
                    <ArrowLeft className="h-4 w-4" />
                    Volver a la lista
                </Link>
            </Button>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="glass capitalize">{client.status.replace('_', ' ')}</Badge>
                {client.agreements && <Badge className="bg-primary text-primary-foreground font-bold">{client.agreements.agreement_name}</Badge>}
            </div>
      </div>

      <ClientHeader 
        client={client}
        onArchive={handleArchive}
        isArchiving={isPending}
        onCopyLink={copyToClipboard}
        orderLink={orderLink}
        editDialog={
            <UpsertClientDialog client={client}>
                <ActionButtonWrapper><Edit className="h-5 w-5" /><span>Editar Perfil</span></ActionButtonWrapper>
            </UpsertClientDialog>
        }
        agreementDialog={
            <AssignAgreementDialog client={client}>
                <ActionButtonWrapper><FilePen className="h-5 w-5" /><span>Convenio</span></ActionButtonWrapper>
            </AssignAgreementDialog>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
              {stats && <ClientStats stats={stats} />}
              <ClientAnalysis clientId={client.id} />
              <ClientOrders orders={orders} />
          </div>

          <div className="space-y-6">
              <Card className="glass border-white/5 overflow-hidden">
                  <CardHeader className="bg-white/5 pb-4">
                      <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-primary" />
                          Datos Identificatorios
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground">Dirección</p>
                              <p className="text-sm">{client.address || 'No registrada'}</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground">Email de Contacto</p>
                              <p className="text-sm truncate">{client.email || 'No registrado'}</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground">Ventana Horaria</p>
                              <p className="text-sm">{client.delivery_window || 'No especificada'}</p>
                          </div>
                      </div>
                      {client.instagram && (
                        <div className="flex items-start gap-3">
                            <Instagram className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                            <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground">Instagram</p>
                                <p className="text-sm">{client.instagram}</p>
                            </div>
                        </div>
                      )}
                  </CardContent>
              </Card>

              <Card className="glass border-white/5 bg-primary/5">
                  <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary"/>
                          Condiciones Comerciales
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="p-3 bg-background/50 rounded-lg border border-white/5">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Situación Fiscal</p>
                          <p className="text-sm font-headline">{client.fiscal_status || "No especificada"}</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg border border-white/5 space-y-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Acuerdos del Convenio</p>
                          {isLoadingConditions ? <Skeleton className="h-12 w-full" /> : salesConditions.length > 0 ? (
                              <div className="space-y-3">
                                  {salesConditions.map(sc => (
                                      <div key={sc.sales_conditions.id} className="flex gap-2">
                                        <Landmark className="h-4 w-4 text-primary shrink-0"/>
                                        <div className="text-xs">
                                            <p className="font-bold">{sc.sales_conditions.name}</p>
                                            <p className="text-muted-foreground">{formatRule(sc.sales_conditions.rules)}</p>
                                        </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <p className="text-xs text-muted-foreground italic">No hay condiciones especiales asignadas.</p>
                          )}
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  )
}
