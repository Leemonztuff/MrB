'use client';

import { useEffect, useState } from 'react';
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
    AlertTriangle,
} from 'lucide-react';
import { PortalPageHeader } from '@/components/shared/portal-page-header';
import { PortalProfileSkeleton } from '@/components/shared/portal-skeleton';
import { PortalEmptyState } from '@/components/shared/portal-empty-state';
import { usePortalContext, type PortalClientData } from '@/contexts/portal-context';

const changeTypeLabels: Record<string, string> = {
    contact_name: 'Nombre de contacto',
    email: 'Email',
    cuit: 'CUIT',
    address: 'Direccion',
    delivery_window: 'Ventana de entrega',
    instagram: 'Instagram',
    contact_dni: 'DNI',
    fiscal_status: 'Situacion fiscal',
};

export default function PortalProfilePage() {
    const { toast } = useToast();
    const { client: portalClient, pendingChanges } = usePortalContext();
    const [client, setClient] = useState<PortalClientData | null>(portalClient);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingToken, setIsEditingToken] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingToken, setIsSavingToken] = useState(false);

    const [formData, setFormData] = useState({
        contact_name: '',
        email: '',
        cuit: '',
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
        setClient(portalClient);
        if (!portalClient) return;

        setFormData({
            contact_name: portalClient.contact_name || '',
            email: portalClient.email || '',
            cuit: portalClient.cuit || '',
            address: portalClient.address || '',
            delivery_window: portalClient.delivery_window || '',
            instagram: portalClient.instagram || '',
            contact_dni: portalClient.contact_dni || '',
            fiscal_status: portalClient.fiscal_status || '',
        });
    }, [portalClient]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await updateClientProfile(formData);
            if (response.success) {
                toast({
                    title: 'Cambios enviados',
                    description: 'Los cambios fueron enviados al administrador para aprobacion.',
                });
                setClient(current => current ? { ...current, ...formData } : current);
                setIsEditing(false);
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
            toast({ title: 'Error', description: 'El token debe tener 6 digitos', variant: 'destructive' });
            return;
        }

        setIsSavingToken(true);

        try {
            const response = await updatePortalToken(tokenData.new_token);
            if (response.success) {
                toast({ title: 'Token actualizado', description: 'Tu token de acceso ha sido actualizado correctamente.' });
                setClient(current => current ? { ...current, portal_token: tokenData.new_token } : current);
                setIsEditingToken(false);
                setTokenData({ new_token: '', confirm_token: '' });
            } else {
                toast({ title: 'Error', description: response.error?.message || 'Error al actualizar token', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Error al actualizar el token', variant: 'destructive' });
        } finally {
            setIsSavingToken(false);
        }
    }

    if (!client) return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PortalPageHeader icon={UserIcon} title="Mi Perfil" description="Cargando..." />
            <PortalProfileSkeleton />
        </div>
    );

    const infoFields = [
        { key: 'contact_name', label: 'Nombre de Contacto', value: client.contact_name, icon: UserIcon },
        { key: 'email', label: 'Email', value: client.email, icon: Mail },
        { key: 'cuit', label: 'CUIT', value: formatCuit(client.cuit) || 'Sin registrar', icon: FileText },
        { key: 'contact_dni', label: 'DNI', value: client.contact_dni, icon: FileText },
        { key: 'address', label: 'Direccion', value: client.address, icon: MapPin, span: true },
        { key: 'delivery_window', label: 'Ventana de Entrega', value: client.delivery_window, icon: Calendar },
        { key: 'instagram', label: 'Instagram', value: client.instagram, icon: Instagram },
        { key: 'fiscal_status', label: 'Situacion Fiscal', value: client.fiscal_status, icon: FileText },
        { key: 'agreement', label: 'Convenio', value: client.agreements?.agreement_name || 'Sin convenio', icon: Shield, readonly: true },
    ];

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PortalPageHeader
                icon={UserIcon}
                title="Mi Perfil"
                description="Gestiona tu informacion personal"
                action={!isEditing && (
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
            />

            {!client.cuit && (
                <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5 fade-in-up">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-1">
                                Regularizacion fiscal pendiente
                            </p>
                            <p className="text-xs text-amber-100/90">
                                Estas ingresando con DNI porque no tienes CUIT registrado. Carga tu CUIT para regularizar el acceso.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {pendingChanges.length > 0 && (
                <div className="glass-card p-4 border-primary/20 fade-in-up">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Cambios pendientes de aprobacion
                        </p>
                    </div>
                    <div className="space-y-2">
                        {pendingChanges.map((change) => (
                            <div key={change.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground min-w-[100px]">
                                    {changeTypeLabels[change.change_type] || change.change_type}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">{change.old_value || '(vacio)'}</span>
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

            <div className="glass-card overflow-hidden fade-in-up animation-delay-100" style={{ animationFillMode: 'both' }}>
                <div className="p-4 border-b border-border/30 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Informacion Personal</h3>
                </div>

                <div className="p-4">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="contact_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre de Contacto</Label>
                                    <Input id="contact_name" className="uppercase rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                                    <Input id="email" type="email" className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cuit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CUIT</Label>
                                    <Input
                                        id="cuit"
                                        value={formData.cuit}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                cuit: e.target.value.replace(/[^0-9]/g, '').slice(0, 11),
                                            })
                                        }
                                        disabled={Boolean(client.cuit)}
                                        className={cn(
                                            "rounded-xl h-10",
                                            client.cuit
                                                ? "opacity-50"
                                                : "border-amber-500/30 bg-amber-500/5 focus:bg-amber-500/10"
                                        )}
                                        placeholder="20123456789"
                                    />
                                    <p className="text-[9px] text-muted-foreground italic">
                                        {client.cuit
                                            ? 'No modificable desde el portal'
                                            : 'Ingresa tu CUIT para enviar la regularizacion al administrador'}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="contact_dni" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DNI</Label>
                                    <Input id="contact_dni" className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10" value={formData.contact_dni} onChange={(e) => setFormData({ ...formData, contact_dni: e.target.value })} />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Direccion</Label>
                                    <Input id="address" className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="delivery_window" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ventana de Entrega</Label>
                                    <Input id="delivery_window" className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10" value={formData.delivery_window} onChange={(e) => setFormData({ ...formData, delivery_window: e.target.value })} placeholder="Ej: Lunes a Viernes 9:00 a 18:00" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="instagram" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram</Label>
                                    <Input id="instagram" className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="@tuusuario" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="fiscal_status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Situacion Fiscal</Label>
                                    <Input id="fiscal_status" className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10" value={formData.fiscal_status} onChange={(e) => setFormData({ ...formData, fiscal_status: e.target.value })} placeholder="Ej: Responsable Inscripto" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl h-10 px-6 shadow-lg shadow-primary/20">
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
                                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="font-black uppercase tracking-widest text-[10px] rounded-xl h-10 text-muted-foreground hover:text-foreground">
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
                                        <p className="text-sm font-bold text-foreground truncate">{field.value || '-'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
                                    PIN de 6 digitos para iniciar sesion
                                </p>
                            </div>
                        </div>
                        {!isEditingToken && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingToken(true)} className="rounded-xl border-border/50 font-black uppercase tracking-widest text-[10px] h-9 hover:bg-white/5">
                                Cambiar
                            </Button>
                        )}
                    </div>

                    {isEditingToken && (
                        <form onSubmit={handleTokenSubmit} className="mt-4 pt-4 border-t border-border/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new_token" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nuevo Token (6 digitos)</Label>
                                    <Input id="new_token" type="password" maxLength={6} className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10 tracking-[0.5em] text-center font-mono" value={tokenData.new_token} onChange={(e) => setTokenData({ ...tokenData, new_token: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm_token" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirmar Token</Label>
                                    <Input id="confirm_token" type="password" maxLength={6} className="rounded-xl border-border/50 bg-white/5 focus:bg-white/10 h-10 tracking-[0.5em] text-center font-mono" value={tokenData.confirm_token} onChange={(e) => setTokenData({ ...tokenData, confirm_token: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSavingToken} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl h-10 px-6 shadow-lg shadow-primary/20">
                                    {isSavingToken ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Confirmar'
                                    )}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setIsEditingToken(false)} className="font-black uppercase tracking-widest text-[10px] rounded-xl h-10 text-muted-foreground hover:text-foreground">
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
