'use client';

import { useState, useEffect } from 'react';
import { updateClientProfile, updatePortalToken } from '@/app/actions/portal-client.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCuit } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
    User as UserIcon,
    Mail,
    MapPin,
    Calendar,
    Instagram,
    FileText,
    Shield,
    Clock,
    ArrowRight,
    Pencil,
    X,
    Check,
    Lock,
    Loader2,
} from 'lucide-react';

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

const changeTypeLabels: Record<string, string> = {
    contact_name: 'Nombre de contacto',
    email: 'Email',
    address: 'Dirección',
    delivery_window: 'Ventana de entrega',
    instagram: 'Instagram',
    contact_dni: 'DNI',
    fiscal_status: 'Situación fiscal',
};

function ProfileSkeleton() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/50 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-muted/50 rounded animate-pulse" />
                </div>
            </div>
            <div className="glass-card p-6 animate-pulse space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-20 bg-muted/50 rounded" />
                            <div className="h-4 w-full bg-muted/50 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
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
        } catch {
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
            toast({ title: 'Error', description: 'Los tokens no coinciden', variant: 'destructive' });
            return;
        }

        if (tokenData.new_token.length !== 6) {
            toast({ title: 'Error', description: 'El token debe tener 6 dígitos', variant: 'destructive' });
            return;
        }

        setIsSavingToken(true);

        try {
            const response = await updatePortalToken(tokenData.new_token);
            if (response.success) {
                toast({ title: 'Token actualizado', description: 'Tu token de acceso ha sido actualizado correctamente.' });
                setIsEditingToken(false);
                setTokenData({ new_token: '', confirm_token: '' });
                loadClientData();
            } else {
                toast({ title: 'Error', description: response.error?.message || 'Error al actualizar token', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Error al actualizar el token', variant: 'destructive' });
        } finally {
            setIsSavingToken(false);
        }
    }

    if (isLoading) return <ProfileSkeleton />;

    if (!client) {
        return <div className="text-center py-8 text-muted-foreground">No se encontró el cliente</div>;
    }

    const infoFields = [
        { key: 'contact_name', label: 'Nombre de Contacto', value: client.contact_name, icon: UserIcon },
        { key: 'email', label: 'Email', value: client.email, icon: Mail },
        { key: 'cuit', label: 'CUIT', value: formatCuit(client.cuit), icon: FileText, readonly: true },
        { key: 'contact_dni', label: 'DNI', value: client.contact_dni, icon: FileText },
        { key: 'address', label: 'Dirección', value: client.address, icon: MapPin, span: true },
        { key: 'delivery_window', label: 'Ventana de Entrega', value: client.delivery_window, icon: Calendar },
        { key: 'instagram', label: 'Instagram', value: client.instagram, icon: Instagram },
        { key: 'fiscal_status', label: 'Situación Fiscal', value: client.fiscal_status, icon: FileText },
        { key: 'agreement', label: 'Convenio', value: client.agreements?.agreement_name || 'Sin convenio', icon: Shield, readonly: true },
    ];

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                            Mi Perfil
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                            Gestiona tu información personal
                        </p>
                    </div>
                </div>
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 font-black uppercase tracking-widest text-[10px] h-9"
                    >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                    </Button>
                )}
            </div>

            {/* Pending Changes */}
            {pendingChanges.length > 0 && (
                <div className="glass-card p-4 border-primary/20 fade-in-up">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Cambios pendientes de aprobación
                        </p>
                    </div>
                    <div className="space-y-2">
                        {pendingChanges.map((change) => (
                            <div key={change.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground min-w-[100px]">
                                    {changeTypeLabels[change.change_type] || change.change_type}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">{change.old_value || '(vacío)'}</span>
                                <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                                <span className="text-xs font-bold text-foreground truncate">{change.new_value}</span>
                                <Badge variant="outline" className="ml-auto text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary px-1.5 py-0 h-4 rounded-full shrink-0">
                                    Pendiente
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Personal Info Card */}
            <div className="glass-card overflow-hidden fade-in-up animation-delay-100" style={{ animationFillMode: 'both' }}>
                <div className="p-4 border-b border-border/30 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Información Personal</h3>
                </div>

                <div className="p-4">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="contact_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre de Contacto</Label>
                                    <Input
                                        id="contact_name"
                                        className="uppercase rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cuit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CUIT</Label>
                                    <Input id="cuit" value={formatCuit(client.cuit)} disabled className="rounded-xl opacity-50 h-10" />
                                    <p className="text-[9px] text-muted-foreground italic">No modificable</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="contact_dni" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DNI</Label>
                                    <Input
                                        id="contact_dni"
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10"
                                        value={formData.contact_dni}
                                        onChange={(e) => setFormData({ ...formData, contact_dni: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dirección</Label>
                                    <Input
                                        id="address"
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="delivery_window" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ventana de Entrega</Label>
                                    <Input
                                        id="delivery_window"
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10"
                                        value={formData.delivery_window}
                                        onChange={(e) => setFormData({ ...formData, delivery_window: e.target.value })}
                                        placeholder="Ej: Lunes a Viernes 9:00 a 18:00"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="instagram" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10"
                                        value={formData.instagram}
                                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder="@tuusuario"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="fiscal_status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Situación Fiscal</Label>
                                    <Input
                                        id="fiscal_status"
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10"
                                        value={formData.fiscal_status}
                                        onChange={(e) => setFormData({ ...formData, fiscal_status: e.target.value })}
                                        placeholder="Ej: Responsable Inscripto"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl h-10 px-6 shadow-lg shadow-primary/20"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-3.5 w-3.5 mr-1.5" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditing(false)}
                                    className="font-black uppercase tracking-widest text-[10px] rounded-xl h-10 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {infoFields.map((field) => (
                                <div
                                    key={field.key}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all",
                                        field.span && "md:col-span-2"
                                    )}
                                >
                                    <field.icon className="h-4 w-4 text-primary mt-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{field.label}</p>
                                        <p className="text-sm font-bold text-foreground truncate">{field.value || '—'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Security Card */}
            <div className="glass-card overflow-hidden fade-in-up animation-delay-200" style={{ animationFillMode: 'both' }}>
                <div className="p-4 border-b border-border/30 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Seguridad</h3>
                </div>

                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                <Lock className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Token de Acceso</p>
                                <p className="text-[10px] text-muted-foreground">
                                    PIN de 6 dígitos para iniciar sesión
                                </p>
                            </div>
                        </div>
                        {!isEditingToken && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditingToken(true)}
                                className="rounded-xl border-border/50 font-black uppercase tracking-widest text-[10px] h-9 hover:bg-white/5"
                            >
                                Cambiar
                            </Button>
                        )}
                    </div>

                    {isEditingToken && (
                        <form onSubmit={handleTokenSubmit} className="mt-4 pt-4 border-t border-border/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new_token" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nuevo Token (6 dígitos)</Label>
                                    <Input
                                        id="new_token"
                                        type="password"
                                        maxLength={6}
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10 tracking-[0.5em] text-center font-mono"
                                        value={tokenData.new_token}
                                        onChange={(e) => setTokenData({
                                            ...tokenData,
                                            new_token: e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                                        })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm_token" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirmar Token</Label>
                                    <Input
                                        id="confirm_token"
                                        type="password"
                                        maxLength={6}
                                        className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10 tracking-[0.5em] text-center font-mono"
                                        value={tokenData.confirm_token}
                                        onChange={(e) => setTokenData({
                                            ...tokenData,
                                            confirm_token: e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={isSavingToken}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl h-10 px-6 shadow-lg shadow-primary/20"
                                >
                                    {isSavingToken ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Confirmar'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditingToken(false)}
                                    className="font-black uppercase tracking-widest text-[10px] rounded-xl h-10 text-muted-foreground hover:text-foreground"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
