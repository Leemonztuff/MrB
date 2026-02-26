'use client';

import { useState, useEffect } from 'react';
import { updateClientProfile, updatePortalToken } from '@/app/actions/portal-client.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCuit } from '@/lib/formatters';

interface ClientData {
    id: string;
    contact_name: string | null;
    email: string | null;
    cuit: string | null;
    address: string | null;
    delivery_window: string | null;
    instagram: string | null;
    contact_dni: string | null;
    fiscal_status: string | null;
    portal_token: string | null;
    agreements?: { agreement_name: string } | null;
}

interface PendingChange {
    id: string;
    change_type: string;
    old_value: string | null;
    new_value: string | null;
    status: string;
    created_at: string;
}

export default function PortalProfilePage() {
    const { toast } = useToast();
    const [client, setClient] = useState<ClientData | null>(null);
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingToken, setIsEditingToken] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingToken, setIsSavingToken] = useState(false);

    const [formData, setFormData] = useState({
        contact_name: '',
        email: '',
        address: '',
        delivery_window: '',
        instagram: '',
        contact_dni: '',
        fiscal_status: '',
    });

    const [tokenData, setTokenData] = useState({
        new_token: '',
        confirm_token: '',
    });

    useEffect(() => {
        loadClientData();
    }, []);

    async function loadClientData() {
        try {
            const response = await fetch('/api/portal/client');
            if (response.ok) {
                const data = await response.json();
                setClient(data.client);
                setFormData({
                    contact_name: data.client.contact_name || '',
                    email: data.client.email || '',
                    address: data.client.address || '',
                    delivery_window: data.client.delivery_window || '',
                    instagram: data.client.instagram || '',
                    contact_dni: data.client.contact_dni || '',
                    fiscal_status: data.client.fiscal_status || '',
                });
                setPendingChanges(data.pendingChanges || []);
            }
        } catch (error) {
            console.error('Error loading client:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await updateClientProfile(formData);
            if (response.success) {
                toast({
                    title: 'Cambios enviados',
                    description: 'Los cambios fueron enviados al administrador para aprobación.',
                });
                setIsEditing(false);
                loadClientData();
            } else {
                toast({
                    title: 'Error',
                    description: response.error?.message || 'Error al guardar',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al guardar los cambios',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleTokenSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (tokenData.new_token !== tokenData.confirm_token) {
            toast({
                title: 'Error',
                description: 'Los tokens no coinciden',
                variant: 'destructive',
            });
            return;
        }

        if (tokenData.new_token.length !== 6) {
            toast({
                title: 'Error',
                description: 'El token debe tener 6 dígitos',
                variant: 'destructive',
            });
            return;
        }

        setIsSavingToken(true);

        try {
            const response = await updatePortalToken(tokenData.new_token);
            if (response.success) {
                toast({
                    title: 'Token actualizado',
                    description: 'Tu token de acceso ha sido actualizado correctamente.',
                });
                setIsEditingToken(false);
                setTokenData({ new_token: '', confirm_token: '' });
                loadClientData();
            } else {
                toast({
                    title: 'Error',
                    description: response.error?.message || 'Error al actualizar token',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al actualizar el token',
                variant: 'destructive',
            });
        } finally {
            setIsSavingToken(false);
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>;
    }

    if (!client) {
        return <div className="text-center py-8">No se encontró el cliente</div>;
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Mi Perfil</h2>
                    <p className="text-gray-500">Gestiona tu información personal</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>Editar Información</Button>
                )}
            </div>

            {pendingChanges.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-yellow-800">Cambios pendientes de aprobación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pendingChanges.map((change) => (
                                <div key={change.id} className="flex justify-between text-sm">
                                    <span className="font-medium">
                                        {changeTypeLabels[change.change_type] || change.change_type}:
                                    </span>
                                    <span className="text-gray-600">
                                        {change.old_value || '(vacío)'} → {change.new_value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_name">Nombre de Contacto</Label>
                                    <Input
                                        id="contact_name"
                                        className="uppercase"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cuit">CUIT</Label>
                                    <Input id="cuit" value={formatCuit(client.cuit)} disabled />
                                    <p className="text-xs text-muted-foreground">El CUIT no se puede modificar</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_dni">DNI</Label>
                                    <Input
                                        id="contact_dni"
                                        value={formData.contact_dni}
                                        onChange={(e) => setFormData({ ...formData, contact_dni: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Dirección</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="delivery_window">Ventana de Entrega</Label>
                                    <Input
                                        id="delivery_window"
                                        value={formData.delivery_window}
                                        onChange={(e) => setFormData({ ...formData, delivery_window: e.target.value })}
                                        placeholder="Ej: Lunes a Viernes 9:00 a 18:00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        value={formData.instagram}
                                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder="@tuusuario"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fiscal_status">Situación Fiscal</Label>
                                    <Input
                                        id="fiscal_status"
                                        value={formData.fiscal_status}
                                        onChange={(e) => setFormData({ ...formData, fiscal_status: e.target.value })}
                                        placeholder="Ej: Responsable Inscripto"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nombre de Contacto</p>
                                <p>{client.contact_name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p>{client.email || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">CUIT</p>
                                <p>{formatCuit(client.cuit)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">DNI</p>
                                <p>{client.contact_dni || '-'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium text-gray-500">Dirección</p>
                                <p>{client.address || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Ventana de Entrega</p>
                                <p>{client.delivery_window || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Instagram</p>
                                <p>{client.instagram || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Situación Fiscal</p>
                                <p>{client.fiscal_status || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Convenio</p>
                                <p>{client.agreements?.agreement_name || 'Sin convenio'}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Seguridad</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Token de Acceso</p>
                            <p className="text-sm text-gray-500">
                                Usado para iniciar sesión en el portal
                            </p>
                        </div>
                        {!isEditingToken && (
                            <Button variant="outline" onClick={() => setIsEditingToken(true)}>
                                Cambiar Token
                            </Button>
                        )}
                    </div>
                    
                    {isEditingToken && (
                        <form onSubmit={handleTokenSubmit} className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new_token">Nuevo Token (6 dígitos)</Label>
                                <Input
                                    id="new_token"
                                    type="password"
                                    maxLength={6}
                                    value={tokenData.new_token}
                                    onChange={(e) => setTokenData({ 
                                        ...tokenData, 
                                        new_token: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) 
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm_token">Confirmar Token</Label>
                                <Input
                                    id="confirm_token"
                                    type="password"
                                    maxLength={6}
                                    value={tokenData.confirm_token}
                                    onChange={(e) => setTokenData({ 
                                        ...tokenData, 
                                        confirm_token: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) 
                                    })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSavingToken}>
                                    {isSavingToken ? 'Guardando...' : 'Confirmar'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsEditingToken(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
