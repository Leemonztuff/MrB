'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { submitMinimalOnboarding } from '@/app/actions/user.actions';
import { Logo } from '@/app/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { provinces, getLocalitiesByProvince } from '@/lib/geo-data';
import { onboardingMinimalSchema } from '@/lib/validations/client.schema';

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
                toast({ title: 'Bienvenido', description: 'Tus datos fueron registrados. Cargando catalogo...' });
                router.refresh();
                return;
            }

            toast({
                title: 'Error',
                description: result.error?.message || 'Hubo un problema al registrar tus datos.',
                variant: 'destructive'
            });
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 pt-12">
            <Logo showText logoUrl={logoUrl} className="mb-8 scale-110" />

            <Card className="glass w-full max-w-lg overflow-hidden border-white/10 shadow-2xl">
                <CardHeader className="pb-2 text-center">
                    <CardTitle className="text-3xl font-black italic tracking-tighter">Bienvenido a Mr. Blonde</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary/70">
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Nombre del negocio / contacto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Barberia Central" className="h-12 rounded-xl border-white/10 bg-white/5 font-bold italic" {...field} />
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">WhatsApp / Telefono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 1123456789" className="h-12 rounded-xl border-white/10 bg-white/5 font-bold italic" {...field} />
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Provincia</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 font-bold italic">
                                                        <SelectValue placeholder="Provincia" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass border-white/10">
                                                    <ScrollArea className="h-72">
                                                        {provinces.filter(Boolean).map(province => (
                                                            <SelectItem key={province} value={province}>
                                                                {province}
                                                            </SelectItem>
                                                        ))}
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Localidad</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedProvince}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 font-bold italic">
                                                        <SelectValue placeholder="Localidad" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass border-white/10">
                                                    <ScrollArea className="h-72">
                                                        {availableLocalities.filter(Boolean).map(locality => (
                                                            <SelectItem key={locality} value={locality}>
                                                                {locality}
                                                            </SelectItem>
                                                        ))}
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
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Calle (Direccion)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Av. Corrientes" className="h-12 rounded-xl border-white/10 bg-white/5 font-bold italic" {...field} />
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
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Altura</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="123" className="h-12 rounded-xl border-white/10 bg-white/5 font-bold italic" {...field} />
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
                                className="group h-14 w-full rounded-2xl bg-primary text-sm font-black uppercase tracking-[0.2em] text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                            >
                                {isPending ? 'Registrando...' : (
                                    <span className="flex items-center gap-2">
                                        Continuar al Catalogo
                                        <span className="group-hover:translate-x-1">{'->'}</span>
                                    </span>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <p className="mt-8 max-w-xs text-center text-[10px] font-black uppercase tracking-widest opacity-30 italic leading-relaxed">
                Al continuar, aceptas que Mr. Blonde procese tus datos para la gestion comercial de tu cuenta.
            </p>
        </div>
    );
}
