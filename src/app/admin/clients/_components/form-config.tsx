
"use client";

import { z } from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getAgreements } from "@/app/admin/actions/agreements.actions";
import type { FormConfig } from "../../_components/entity-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import type { Agreement } from "@/types";

const clientSchema = z.object({
  contact_name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("Debe ser un email válido."),
  agreement_id: z.string().nullable(),
});

const getClientDefaultValues = (client?: any) => ({
  contact_name: client?.contact_name ?? "",
  email: client?.email ?? "",
  agreement_id: client?.agreement_id ?? null,
});

const RenderClientFields = ({ form }: { form: any }) => {
    const [agreements, setAgreements] = useState<Agreement[]>([]);

    useEffect(() => {
        const fetchAgreements = async () => {
            const { data } = await getAgreements();
            setAgreements(data ?? []);
        };
        fetchAgreements();
    }, []);

    return (
        <>
            <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre del Cliente</FormLabel>
                        <FormControl>
                            <Input placeholder="Nombre del contacto principal" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="cliente@email.com" {...field} />
                        </FormControl>
                         <FormDescription>
                            Se usará para notificaciones y como identificador.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="agreement_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Convenio (Opcional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === 'null' ? null : value)} defaultValue={field.value ?? 'null'}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Asignar un convenio..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="null">Ninguno por ahora</SelectItem>
                        {agreements.map(agreement => (
                            <SelectItem key={agreement.id} value={agreement.id}>
                            {agreement.agreement_name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        Puedes asignar un convenio ahora o hacerlo más tarde.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </>
    );
};

export const clientFormConfig: FormConfig<typeof clientSchema> = {
    entityName: "Cliente",
    schema: clientSchema,
    upsertAction: (values) => { throw new Error("Upsert client not implemented via this form") },
    getDefaultValues: getClientDefaultValues,
    renderFields: (form: any) => <RenderClientFields form={form} />,
};
