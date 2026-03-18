
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingMinimalSchema } from '@/lib/validations/client.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces, getLocalitiesByProvince } from '@/lib/geo-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { submitMinimalOnboarding } from '@/app/actions/user.actions';
import { Logo } from '@/app/logo';
import { useRouter } from 'next/navigation';

interface OnboardingInlineProps {
    token: string;
    clientName?: string;
    logoUrl?: string | null;
}

export function OnboardingInline({ token, clientName, logoUrl }: OnboardingInlineProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(onboardingMinimalSchema),
        defaultValues: {
            contact_name: clientName?.startsWith('Cliente Pendiente') ? '' : clientName || '',
            phone: '',
            street_address: '',
            street_number: '',
            locality: '',
            province: '',
            onboarding_token: token,
        }
    });

    const watchedProvince = form.watch('province');
    const availableLocalities = watchedProvince ? getLocalitiesByProvince(watchedProvince) : [];

    const onSubmit = (values: any) => {
        startTransition(async () => {
            const result = await submitMinimalOnboarding(values);
            if (result.success) {
                toast({ title: '¡Bienvenido!', description: 'Tus datos han sido registrados. Cargando catálogo...' });
                router.refresh(); // This will trigger getOrderPageData again and switch mode to 'catalog'
            } else {
                toast({
                    title: 'Error',
                    description: result.error?.message || 'Hubo un problema al registrar tus datos.',
                    variant: 'destructive'
                });
            }
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background pt-12">
            <Logo showText logoUrl={logoUrl} className="mb-8 scale-110" />

            <Card className="w-full max-w-lg glass border-white/10 shadow-2xl overflow-hidden">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl font-black italic tracking-tighter">Bienvenido a Mr. Blonde</CardTitle>
                    <CardDescription className="text-xs uppercase font-bold tracking-widest text-primary/70">
                        Completa tus datos para realizar tu primer pedido
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="contact_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase font-black tracking-widest opacity-70">Nombre del Negocio / Contacto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Barbería Central" className="bg-white/5 border-white/10 rounded-xl h-12 font-bold italic" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase font-black tracking-widest opacity-70">WhatsApp / Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 1123456789" className="bg-white/5 border-white/10 rounded-xl h-12 font-bold italic" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="province"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase font-black tracking-widest opacity-70">Provincia</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12 font-bold italic">
                                                        <SelectValue placeholder="Provincia" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass border-white/10">
                                                    <ScrollArea className="h-72">
                                                        {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                    </ScrollArea>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="locality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase font-black tracking-widest opacity-70">Localidad</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedProvince}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12 font-bold italic">
                                                        <SelectValue placeholder="Localidad" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass border-white/10">
                                                    <ScrollArea className="h-72">
                                                        {availableLocalities.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                    </ScrollArea>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="street_address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black tracking-widest opacity-70">Calle (Dirección)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Av. Corrientes" className="bg-white/5 border-white/10 rounded-xl h-12 font-bold italic" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={form.control}
                                        name="street_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black tracking-widest opacity-70">Altura</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="123" className="bg-white/5 border-white/10 rounded-xl h-12 font-bold italic" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                            >
                                {isPending ? "Registrando..." : (
                                    <span className="flex items-center gap-2">
                                        Continuar al Catálogo
                                        <span className="group-hover:translate-x-1">→</span>
                                    </span>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <p className="mt-8 text-[10px] font-black uppercase tracking-widest opacity-30 italic text-center max-w-xs leading-relaxed">
                Al continuar, aceptas que Mr. Blonde procese tus datos para la gestión comercial de tu cuenta.
            </p>
        </div>
    );
}
