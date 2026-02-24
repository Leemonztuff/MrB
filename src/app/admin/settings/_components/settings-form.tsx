
"use client";

import { useTransition } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { updateSettings } from '@/app/admin/actions/settings.actions';
import type { AppSettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoUploader } from './LogoUploader';

const settingsSchema = z.object({
    whatsapp_number: z.string().min(10, "Debe ser un número válido."),
    vat_percentage: z.coerce.number().min(0, "Debe ser un número positivo."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ settings }: { settings: AppSettings }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            whatsapp_number: settings.whatsapp_number || "",
            vat_percentage: settings.vat_percentage || 21,
        },
    });

    const onSubmit = (values: SettingsFormValues) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('whatsapp_number', values.whatsapp_number);
            formData.append('vat_percentage', String(values.vat_percentage));
            
            const result = await updateSettings(formData);

            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Éxito", description: "Configuración guardada correctamente." });
            }
        });
    };

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                        <CardTitle>Ajustes Generales</CardTitle>
                        <CardDescription>
                            Configura variables importantes para el funcionamiento de la app.
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="whatsapp_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de WhatsApp</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., 5491123456789" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Este es el número al que se enviarán los resúmenes de pedido.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vat_percentage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Porcentaje de IVA (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="21" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Este porcentaje se usará para calcular el total de los pedidos.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Guardando..." : "Guardar Ajustes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </FormProvider>
            <LogoUploader currentLogoUrl={settings.logo_url} />
        </div>
    );
}
