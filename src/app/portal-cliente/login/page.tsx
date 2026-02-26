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

const portalLoginSchema = z.object({
    cuit: z.string().min(11, 'CUIT debe tener 11 dígitos'),
    token: z.string().length(6, 'Token debe tener 6 dígitos'),
});

type PortalLoginForm = z.infer<typeof portalLoginSchema>;

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Ingresando...' : 'Ingresar'}
        </Button>
    );
}

export default function PortalLoginPage() {
    const [state, action] = useFormState<AuthState | null, FormData>(loginPortal, null);
    
    const form = useForm<PortalLoginForm>({
        resolver: zodResolver(portalLoginSchema),
        defaultValues: {
            cuit: '',
            token: '',
        },
    });

    const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
        form.setValue('cuit', value);
    };

    const handleCuitBlur = () => {
        const cuit = form.getValues('cuit');
        if (cuit.length === 11) {
            form.setValue('token', cuit.slice(0, 6));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Portal de Cliente</CardTitle>
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
                                        <FormLabel>CUIT</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="20-31895155-2"
                                                onChange={handleCuitChange}
                                                onBlur={handleCuitBlur}
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
                                        <FormLabel>Token (6 dígitos)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="203189"
                                                maxLength={6}
                                                type="password"
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
                                <p className="text-sm text-red-500">{state.error.message}</p>
                            )}
                            <SubmitButton />
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
