
"use client";

import Link from 'next/link';
import { useTransition, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Edit, FilePen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientHeader } from "./client-header";
import { ClientOrders } from "./client-orders";
import { ClientSummaryTab } from "./client-summary-tab";
import { ClientInfoTab } from "./client-info-tab";
import { ClientConditionsTab } from "./client-conditions-tab";
import type { Client, ClientStats as StatsType, OrderWithItems } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { AssignAgreementDialog } from '../../_components/assign-agreement-dialog';
import { ActionButtonWrapper } from './client-action-buttons';
import { UpsertClientDialog } from '../../_components/upsert-client-dialog';
import { deleteClient } from '@/app/admin/actions/clients.actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ClientDetailsClient({ client: initialClient, stats, orders }: { client: Client, stats: StatsType | null, orders: OrderWithItems[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [client, setClient] = useState(initialClient);
    const [orderLink, setOrderLink] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && client.agreement_id && client.status === 'active') {
            setOrderLink(`${window.location.origin}/portal/catalogo`);
        }
    }, [client.agreement_id, client.status]);

    useEffect(() => { setClient(initialClient); }, [initialClient]);

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

    const lastOrderDate = orders.length > 0 
        ? new Date(Math.max(...orders.map(o => new Date(o.created_at).getTime()))).toLocaleDateString('es-AR')
        : null;

    return (
        <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground group transition-colors" asChild>
                    <Link href="/admin/clients">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Volver a Clientes</span>
                    </Link>
                </Button>
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

            <Tabs defaultValue="resumen" className="w-full">
                <TabsList className="w-full justify-start bg-white/5 p-1 h-auto rounded-lg overflow-x-auto">
                    <TabsTrigger 
                        value="resumen"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-4 py-2 text-sm"
                    >
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger 
                        value="pedidos"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-4 py-2 text-sm"
                    >
                        Pedidos ({orders.length})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="info"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-4 py-2 text-sm"
                    >
                        Información
                    </TabsTrigger>
                    <TabsTrigger 
                        value="condiciones"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-4 py-2 text-sm"
                    >
                        Condiciones
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="resumen" className="mt-6">
                    <ClientSummaryTab 
                        stats={stats} 
                        lastOrderDate={lastOrderDate}
                        clientStatus={client.status}
                    />
                </TabsContent>

                <TabsContent value="pedidos" className="mt-6">
                    <ClientOrders orders={orders} />
                </TabsContent>

                <TabsContent value="info" className="mt-6">
                    <ClientInfoTab client={client} />
                </TabsContent>

                <TabsContent value="condiciones" className="mt-6">
                    <ClientConditionsTab client={client} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
