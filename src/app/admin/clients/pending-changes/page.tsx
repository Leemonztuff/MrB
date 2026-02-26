'use client';

import { useState, useEffect } from 'react';
import { getPendingChanges, approveChange, rejectChange } from '@/app/admin/actions/clients.actions';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingChange {
    id: string;
    client_id: string;
    change_type: string;
    old_value: string | null;
    new_value: string | null;
    status: string;
    created_at: string;
    clients: {
        contact_name: string | null;
        email: string | null;
        cuit: string | null;
    };
}

const changeTypeLabels: Record<string, string> = {
    contact_name: 'Nombre de contacto',
    email: 'Email',
    address: 'Dirección',
    delivery_window: 'Ventana de entrega',
    instagram: 'Instagram',
    contact_dni: 'DNI',
    fiscal_status: 'Situación fiscal',
};

export default function PendingChangesPage() {
    const { toast } = useToast();
    const [changes, setChanges] = useState<PendingChange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadChanges();
    }, []);

    async function loadChanges() {
        setIsLoading(true);
        try {
            const response = await getPendingChanges();
            if (response.success) {
                setChanges(response.data || []);
            }
        } catch (error) {
            console.error('Error loading changes:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleApprove(changeId: string) {
        setProcessingId(changeId);
        try {
            const response = await approveChange(changeId);
            if (response.success) {
                toast({
                    title: 'Cambio aprobado',
                    description: 'El cambio ha sido aplicado correctamente.',
                });
                loadChanges();
            } else {
                toast({
                    title: 'Error',
                    description: response.error?.message || 'Error al aprobar el cambio',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al aprobar el cambio',
                variant: 'destructive',
            });
        } finally {
            setProcessingId(null);
        }
    }

    async function handleReject(changeId: string) {
        setProcessingId(changeId);
        try {
            const response = await rejectChange(changeId);
            if (response.success) {
                toast({
                    title: 'Cambio rechazado',
                    description: 'El cambio ha sido rechazado.',
                });
                loadChanges();
            } else {
                toast({
                    title: 'Error',
                    description: response.error?.message || 'Error al rechazar el cambio',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al rechazar el cambio',
                variant: 'destructive',
            });
        } finally {
            setProcessingId(null);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Cambios Pendientes"
                description="Revisa y aprueba los cambios solicitados por los clientes en su información."
            />

            {changes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">No hay cambios pendientes de aprobación.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {changes.map((change) => (
                        <Card key={change.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">
                                            {change.clients?.contact_name || 'Cliente'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {change.clients?.email || 'Sin email'}
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {changeTypeLabels[change.change_type] || change.change_type}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Valor Actual</p>
                                        <p className="text-sm">{change.old_value || '(vacío)'}</p>
                                    </div>
                                    <div className="text-gray-400">→</div>
                                    <div className="flex-1 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-xs text-blue-600 mb-1">Nuevo Valor</p>
                                        <p className="text-sm font-medium">{change.new_value}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">
                                        Solicitado {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: es })}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(change.id)}
                                            disabled={processingId === change.id}
                                        >
                                            {processingId === change.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4 mr-1" />
                                            )}
                                            Rechazar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(change.id)}
                                            disabled={processingId === change.id}
                                        >
                                            {processingId === change.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4 mr-1" />
                                            )}
                                            Aprobar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
