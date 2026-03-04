
import { createClient as createServerClient } from '@/lib/supabase/server';
import { Logo } from '@/app/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPublicLogoUrl } from '@/app/admin/actions/settings.actions';
import { formatDate, cn } from '@/lib/utils';
import { CheckCircle, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';

export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createServerClient();
    const logoUrl = await getPublicLogoUrl();

    const { data: order, error } = await supabase
        .from('orders')
        .select('*, agreements(agreement_name)')
        .eq('id', id)
        .single();

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <Logo showText logoUrl={logoUrl} className="mb-8" />
                <Card className="w-full max-w-md glass border-destructive/20">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-destructive font-black italic">Pedido no encontrado</CardTitle>
                        <CardDescription>No pudimos encontrar la información de este pedido.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const statusConfig = {
        armado: { label: 'En Armado', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        transito: { label: 'En Tránsito', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        entregado: { label: 'Entregado', icon: PackageCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    };

    const currentStatus = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.armado;
    const StatusIcon = currentStatus.icon;

    return (
        <div className="min-h-screen flex flex-col items-center p-4 bg-background pt-12 md:pt-24 font-sans">
            <Logo showText logoUrl={logoUrl} className="mb-12 scale-110" />

            <Card className="w-full max-w-xl glass border-white/10 shadow-2xl overflow-hidden">
                <CardHeader className="text-center border-b border-white/5 pb-8">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Pedido</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">#{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <CardTitle className="text-4xl font-black italic tracking-tighter mb-2">Estado del Envío</CardTitle>
                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60 italic">
                        {order.agreements?.agreement_name || 'Mr. Blonde Original'}
                    </p>
                </CardHeader>

                <CardContent className="pt-10 pb-10 space-y-12">
                    {/* Status Visualizer */}
                    <div className="flex justify-between items-start relative px-4">
                        <div className="absolute top-6 left-12 right-12 h-[2px] bg-white/5 -z-10" />
                        <div className="absolute top-6 left-12 h-[2px] bg-primary transition-all duration-1000 -z-10" style={{ width: order.status === 'entregado' ? 'calc(100% - 6rem)' : order.status === 'transito' ? '50%' : '0%' }} />

                        <div className="flex flex-col items-center gap-3">
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-500", order.status === 'armado' || order.status === 'transito' || order.status === 'entregado' ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-background border-white/10")}>
                                <Clock className={cn("h-6 w-6", order.status === 'armado' || order.status === 'transito' || order.status === 'entregado' ? "text-primary-foreground" : "text-muted-foreground")} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Armado</span>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-500", order.status === 'transito' || order.status === 'entregado' ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-background border-white/10")}>
                                <Truck className={cn("h-6 w-6", order.status === 'transito' || order.status === 'entregado' ? "text-primary-foreground" : "text-muted-foreground")} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tránsito</span>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-500", order.status === 'entregado' ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-background border-white/10")}>
                                <PackageCheck className={cn("h-6 w-6", order.status === 'entregado' ? "text-primary-foreground" : "text-muted-foreground")} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Entregado</span>
                        </div>
                    </div>

                    <div className={cn("mx-auto max-w-sm rounded-2xl p-6 text-center border transition-all duration-500", currentStatus.bg, "border-white/5")}>
                        <div className={cn("inline-flex p-3 rounded-xl mb-3", currentStatus.bg)}>
                            <StatusIcon className={cn("h-8 w-8", currentStatus.color)} />
                        </div>
                        <h3 className={cn("text-2xl font-black italic tracking-tighter mb-1", currentStatus.color)}>
                            {currentStatus.label}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">
                            Actualizado el {formatDate(order.created_at)}
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center text-sm p-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Cliente</span>
                            <span className="font-bold italic">{order.client_name_cache}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Total aproximado</span>
                            <span className="font-headline font-black text-primary">${new Intl.NumberFormat('es-AR').format(order.total_amount)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <p className="mt-12 text-[10px] font-black uppercase tracking-widest opacity-30 italic text-center max-w-xs leading-relaxed">
                Este es un portal de seguimiento público. No requiere inicio de sesión.
            </p>
        </div>
    );
}

// Fixed import for cn and helper
import { cn } from '@/lib/utils';
