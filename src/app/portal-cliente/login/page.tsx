'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginPortal } from '@/app/actions/portal.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AuthState } from '@/types';
import { Lock, User } from 'lucide-react';

const portalLoginSchema = z.object({
    cuit: z.string().min(11, 'CUIT debe tener 11 dígitos'),
    token: z.string().length(6, 'Token debe tener 6 dígitos'),
});

type PortalLoginForm = z.infer<typeof portalLoginSchema>;

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
                <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Ingresando...
                </span>
            ) : (
                'Ingresar'
            )}
        </Button>
    );
}

export default function PortalLoginPage() {
    const [state, action] = useFormState<AuthState | null, FormData>(loginPortal, null);
    
    const form = useForm<PortalLoginForm>({
        resolver: zodResolver(portalLoginSchema),
        defaultValues: {
            cuid: '',
            token: '',
        },
    });

    const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
        form.setValue('cuit', value);
    };

    const handleCuitBlur = () => {
        const cuid = form.getValues('cuit');
        if (cuid.length === 11) {
            form.setValue('token', cuid.slice(0, 6));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <span className="text-white font-bold text-2xl">MB</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Mr. Blonde</h1>
                    <p className="text-gray-500 mt-2">Portal de Cliente</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="space-y-1 text-center pb-4">
                        <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
                        <CardDescription>
                            Ingresá tu CUIT y token para acceder a tu cuenta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form action={action} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="cuit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                CUIT
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="20-31895155-2"
                                                    onChange={handleCuitChange}
                                                    onBlur={handleCuitBlur}
                                                    className="h-10"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="token"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Token (6 dígitos)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="203189"
                                                    maxLength={6}
                                                    type="password"
                                                    className="h-10"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-muted-foreground">
                                                Por defecto son los primeros 6 dígitos del CUIT
                                            </p>
                                        </FormItem>
                                    )}
                                />
                                {state && state.error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                                        {state.error.message}
                                    </div>
                                )}
                                <SubmitButton />
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-500">
                    ¿Necesitás ayuda? Contactá al administrador
                </p>
            </div>
        </div>
    );
}
