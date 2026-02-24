
"use client";

import { useTransition, useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { upsertClient } from "@/app/admin/actions/clients.actions";
import { getAgreements } from "@/app/admin/actions/agreements.actions";
import type { Client, Agreement } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { provinces, getLocalitiesByProvince } from "@/lib/geo-data";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// CUIT Validation Logic
const validateCuit = (cuit: string): boolean | number => {
  if (!/^\d{11}$/.test(cuit)) return false;
  const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = cuit.split('').map(Number);
  const digitoVerificador = digitos.pop()!;
  let acumulado = 0;
  for (let i = 0; i < digitos.length; i++) {
    acumulado += digitos[i] * coeficientes[i];
  }
  const resto = acumulado % 11;
  let digitoCalculado = 11 - resto;
  if (digitoCalculado === 11) {
    digitoCalculado = 0;
  } else if (digitoCalculado === 10) {
    return false;
  }
  return digitoVerificador === digitoCalculado ? true : digitoCalculado;
};

const cuitSchema = z.string().superRefine((cuit, ctx) => {
    if (!cuit) return;
    const validationResult = validateCuit(cuit);
    if (validationResult === true) return;
    if (typeof validationResult === 'number') {
        const CUITBase = cuit.slice(0, -1);
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `CUIT inválido. El dígito verificador debería ser ${validationResult}.` });
    } else {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CUIT inválido. Debe tener 11 dígitos sin guiones y ser válido." });
    }
});

const deliveryDays = [
  { id: 'lunes', label: 'L' },
  { id: 'martes', label: 'M' },
  { id: 'miercoles', label: 'Mi' },
  { id: 'jueves', label: 'J' },
  { id: 'viernes', label: 'V' },
  { id: 'sabado', label: 'S' },
];

const generateTimeOptions = () => {
    const options = [];
    for (let h = 8; h <= 20; h++) {
        const hour = h.toString().padStart(2, '0');
        options.push(`${hour}:00`);
    }
    return options;
};
const timeOptions = generateTimeOptions();


const formSchema = z.object({
  contact_name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("Debe ser un email válido."),
  cuit: cuitSchema.optional().or(z.literal('')),
  contact_dni: z.string().optional(),
  fiscal_status: z.string().optional(),
  instagram: z.string().optional(),
  agreement_id: z.string().nullable().optional(),
  
  province: z.string().optional(),
  locality: z.string().optional(),
  street_address: z.string().optional(),
  street_number: z.string().optional(),

  delivery_days: z.array(z.string()).optional(),
  delivery_time_from: z.string().optional(),
  delivery_time_to: z.string().optional(),
});

type UpsertClientFormValues = z.infer<typeof formSchema>;

const getAddressParts = (address: string | null) => {
  if (!address) return { street_address: '', street_number: '', locality: '', province: '' };
  const parts = address.split(',').map(p => p.trim());
  const province = provinces.find(p => p === parts[parts.length - 1]);
  const locality = province && parts[parts.length - 2] ? parts[parts.length - 2] : '';
  const streetAndNumberMatch = (parts[0] || '').match(/^(.*?)(\s+\d+)?$/);
  return {
    street_address: streetAndNumberMatch ? streetAndNumberMatch[1] : '',
    street_number: streetAndNumberMatch && streetAndNumberMatch[2] ? streetAndNumberMatch[2].trim() : '',
    locality: locality || '',
    province: province || '',
  };
};

const getDeliveryParts = (deliveryWindow: string | null) => {
  if (!deliveryWindow) return { days: [], from: '09:00', to: '18:00' };
  const parts = deliveryWindow.split(' de ');
  if (parts.length < 2) return { days: [], from: '09:00', to: '18:00' };
  const dayString = parts[0].toLowerCase();
  
  // Corrected logic: filter first, then map.
  const days = deliveryDays
    .filter(day => dayString.includes(day.id.slice(0, 3)))
    .map(day => day.id);

  const timeParts = parts[1].replace('hs', '').split(' a ');
  return {
    days,
    from: timeParts[0] ? `${timeParts[0].padStart(2, '0')}:00` : '09:00',
    to: timeParts[1] ? `${timeParts[1].padStart(2, '0')}:00` : '18:00',
  };
};

export function UpsertClientForm({ client, onSuccess, onCancel }: { client?: Client, onSuccess: () => void, onCancel: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const { toast } = useToast();

  const addressParts = getAddressParts(client?.address || null);
  const deliveryParts = getDeliveryParts(client?.delivery_window || null);

  const form = useForm<UpsertClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact_name: client?.contact_name ?? "",
      email: client?.email ?? "",
      cuit: client?.cuit ?? "",
      contact_dni: client?.contact_dni ?? "",
      fiscal_status: client?.fiscal_status ?? "",
      instagram: client?.instagram ?? "",
      agreement_id: client?.agreement_id ?? null,
      province: addressParts.province,
      locality: addressParts.locality,
      street_address: addressParts.street_address,
      street_number: addressParts.street_number,
      delivery_days: deliveryParts.days,
      delivery_time_from: deliveryParts.from,
      delivery_time_to: deliveryParts.to,
    },
  });

  const watchedProvince = form.watch("province");
  const availableLocalities = watchedProvince ? getLocalitiesByProvince(watchedProvince) : [];
  
  useEffect(() => {
    getAgreements().then(({ data }) => setAgreements(data || []));
  }, []);

  useEffect(() => {
    if (watchedProvince && availableLocalities.length > 0 && !availableLocalities.includes(form.getValues('locality') || '')) {
      form.setValue('locality', '');
    }
  }, [watchedProvince, availableLocalities, form]);

  const onSubmit = (values: UpsertClientFormValues) => {
    startTransition(async () => {
      const result = await upsertClient({ id: client?.id, ...values });
      if (result.error) {
        toast({ title: "Error al guardar", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "¡Cliente guardado!", description: `El cliente ${values.contact_name} ha sido guardado correctamente.` });
        onSuccess();
      }
    });
  };

  return (
    <>
    <ScrollArea className="h-full w-full">
      <div className="px-6 pb-6">
        <Form {...form}>
          <form id="upsert-client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="contact_name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre y Apellido</FormLabel><FormControl><Input placeholder="Nombre de contacto" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="cliente@email.com" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium text-base">Información Fiscal y de Contacto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="fiscal_status" render={({ field }) => (
                    <FormItem><FormLabel>Condición Fiscal</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione una condición..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem><SelectItem value="Monotributista">Monotributista</SelectItem><SelectItem value="Consumidor Final">Consumidor Final</SelectItem><SelectItem value="Exento">Exento</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="cuit" render={({ field }) => (
                    <FormItem><FormLabel>CUIT</FormLabel><FormControl><Input placeholder="11 dígitos sin guiones" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="contact_dni" render={({ field }) => (
                    <FormItem><FormLabel>DNI</FormLabel><FormControl><Input placeholder="Sin puntos" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="instagram" render={({ field }) => (
                    <FormItem><FormLabel>Instagram (Opcional)</FormLabel><FormControl><Input placeholder="@usuario" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium text-base">Dirección de Entrega</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="province" render={({ field }) => (
                  <FormItem><FormLabel>Provincia</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione una provincia..." /></SelectTrigger></FormControl><SelectContent><ScrollArea className="h-72">{provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</ScrollArea></SelectContent></Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="locality" render={({ field }) => (
                  <FormItem><FormLabel>Localidad</FormLabel><Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedProvince}><FormControl><SelectTrigger><SelectValue placeholder={watchedProvince ? "Seleccione una localidad..." : "Elija provincia"} /></SelectTrigger></FormControl><SelectContent><ScrollArea className="h-72">{availableLocalities.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</ScrollArea></SelectContent></Select><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2"><FormField control={form.control} name="street_address" render={({ field }) => (
                      <FormItem><FormLabel>Calle</FormLabel><FormControl><Input placeholder="Ej: Av. Corrientes" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/></div>
                  <div><FormField control={form.control} name="street_number" render={({ field }) => (
                      <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="Ej: 1234" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/></div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium text-base">Ventana Horaria de Entrega</h4>
              <FormField control={form.control} name="delivery_days" render={({ field }) => (
                <FormItem>
                  <FormLabel>Días de Entrega</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {deliveryDays.map((day) => {
                        const isSelected = field.value?.includes(day.id);
                        return (
                          <Button
                            key={day.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={cn("h-8 w-8 p-0 rounded-full", isSelected && "shadow-md")}
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value?.filter((d) => d !== day.id)
                                : [...(field.value || []), day.id];
                              field.onChange(newValue);
                            }}
                          >
                            {day.label}
                          </Button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="delivery_time_from" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desde</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{timeOptions.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField control={form.control} name="delivery_time_to" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hasta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{timeOptions.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )}/>
              </div>
            </div>

            <FormField control={form.control} name="agreement_id" render={({ field }) => (
              <FormItem><FormLabel>Convenio Comercial</FormLabel><Select onValueChange={(v) => field.onChange(v === 'null' ? null : v)} value={field.value || 'null'}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un convenio..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="null">Ninguno</SelectItem>{agreements.map(a => <SelectItem key={a.id} value={a.id}>{a.agreement_name}</SelectItem>)}</SelectContent></Select><FormDescription>Opcional. Asigna un convenio comercial a este cliente.</FormDescription><FormMessage /></FormItem>
            )}/>
          </form>
        </Form>
      </div>
    </ScrollArea>
    <DialogFooter className="p-6 pt-2 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
        </Button>
        <Button
            type="submit"
            form="upsert-client-form"
            disabled={isPending}
        >
            {isPending ? "Guardando..." : "Guardar Cliente"}
        </Button>
    </DialogFooter>
    </>
  );
}
