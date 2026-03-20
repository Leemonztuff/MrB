"use client";

import { useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { upsertClient } from "@/app/admin/actions/clients.actions";
import { getAgreements } from "@/app/admin/actions/agreements.actions";
import type { Agreement, Client } from "@/types";
import { provinces, getLocalitiesByProvince } from "@/lib/geo-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const validateCuit = (cuit: string): boolean | number => {
  if (!/^\d{11}$/.test(cuit)) return false;

  const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = cuit.split("").map(Number);
  const digitoVerificador = digitos.pop()!;

  let acumulado = 0;
  for (let index = 0; index < digitos.length; index += 1) {
    acumulado += digitos[index] * coeficientes[index];
  }

  const resto = acumulado % 11;
  let digitoCalculado = 11 - resto;
  if (digitoCalculado === 11) digitoCalculado = 0;
  if (digitoCalculado === 10) return false;
  return digitoVerificador === digitoCalculado ? true : digitoCalculado;
};

const cuitSchema = z.string().superRefine((cuit, ctx) => {
  if (!cuit) return;

  const validationResult = validateCuit(cuit);
  if (validationResult === true) return;

  if (typeof validationResult === "number") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `CUIT invalido. El digito verificador deberia ser ${validationResult}.`,
    });
    return;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "CUIT invalido. Debe tener 11 digitos sin guiones y ser valido.",
  });
});

const deliveryDays = [
  { id: "lunes", label: "L" },
  { id: "martes", label: "M" },
  { id: "miercoles", label: "Mi" },
  { id: "jueves", label: "J" },
  { id: "viernes", label: "V" },
  { id: "sabado", label: "S" },
];

const timeOptions = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, "0")}:00`);

const formSchema = z.object({
  contact_name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("Debe ser un email valido."),
  agreement_id: z.string().nullable().optional(),
  cuit: cuitSchema.optional().or(z.literal("")),
  contact_dni: z.string().optional(),
  fiscal_status: z.string().optional(),
  instagram: z.string().optional(),
  province: z.string().optional(),
  locality: z.string().optional(),
  street_address: z.string().optional(),
  street_number: z.string().optional(),
  delivery_days: z.array(z.string()).optional(),
  delivery_time_from: z.string().optional(),
  delivery_time_to: z.string().optional(),
});

type UpsertClientFormValues = z.infer<typeof formSchema>;

type StepId = "basics" | "fiscal" | "address" | "logistics";

const steps: Array<{
  id: StepId;
  title: string;
  description: string;
  fields: (keyof UpsertClientFormValues)[];
}> = [
  {
    id: "basics",
    title: "Datos base",
    description: "Identidad del cliente y convenio inicial.",
    fields: ["contact_name", "email", "agreement_id"],
  },
  {
    id: "fiscal",
    title: "Fiscal",
    description: "CUIT, condicion fiscal y datos complementarios.",
    fields: ["cuit", "contact_dni", "fiscal_status", "instagram"],
  },
  {
    id: "address",
    title: "Direccion",
    description: "Ubicacion de entrega para dejar el cliente listo.",
    fields: ["province", "locality", "street_address", "street_number"],
  },
  {
    id: "logistics",
    title: "Logistica",
    description: "Ventana horaria y dias de entrega.",
    fields: ["delivery_days", "delivery_time_from", "delivery_time_to"],
  },
];

const getAddressParts = (address: string | null) => {
  if (!address) return { street_address: "", street_number: "", locality: "", province: "" };

  const parts = address.split(",").map(part => part.trim());
  const province = provinces.find(item => item === parts[parts.length - 1]);
  const locality = province && parts[parts.length - 2] ? parts[parts.length - 2] : "";
  const streetAndNumberMatch = (parts[0] || "").match(/^(.*?)(\s+\d+)?$/);

  return {
    street_address: streetAndNumberMatch ? streetAndNumberMatch[1] : "",
    street_number: streetAndNumberMatch?.[2]?.trim() || "",
    locality: locality || "",
    province: province || "",
  };
};

const getDeliveryParts = (deliveryWindow: string | null) => {
  if (!deliveryWindow) return { days: [], from: "09:00", to: "18:00" };

  const parts = deliveryWindow.split(" de ");
  if (parts.length < 2) return { days: [], from: "09:00", to: "18:00" };

  const dayString = parts[0].toLowerCase();
  const days = deliveryDays.filter(day => dayString.includes(day.id.slice(0, 3))).map(day => day.id);
  const timeParts = parts[1].replace("hs", "").split(" a ");

  return {
    days,
    from: timeParts[0] ? `${timeParts[0].padStart(2, "0")}:00` : "09:00",
    to: timeParts[1] ? `${timeParts[1].padStart(2, "0")}:00` : "18:00",
  };
};

export function UpsertClientForm({
  client,
  onSuccess,
  onCancel,
}: {
  client?: Client;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
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
  const watchedName = form.watch("contact_name");
  const watchedEmail = form.watch("email");
  const watchedAgreementId = form.watch("agreement_id");
  const availableLocalities = watchedProvince ? getLocalitiesByProvince(watchedProvince) : [];
  const step = steps[currentStep];

  useEffect(() => {
    getAgreements().then(({ data }) => setAgreements(data || []));
  }, []);

  useEffect(() => {
    const currentLocality = form.getValues("locality") || "";
    if (watchedProvince && availableLocalities.length > 0 && currentLocality && !availableLocalities.includes(currentLocality)) {
      form.setValue("locality", "");
    }
  }, [availableLocalities, form, watchedProvince]);

  const stepSummary = [
    watchedName || "Sin nombre",
    watchedEmail || "Sin email",
    agreements.find(agreement => agreement.id === watchedAgreementId)?.agreement_name || "Sin convenio",
  ];

  const goNext = async () => {
    const isValid = await form.trigger(step.fields);
    if (!isValid) return;
    setCurrentStep(previous => Math.min(previous + 1, steps.length - 1));
  };

  const onSubmit = (values: UpsertClientFormValues) => {
    startTransition(async () => {
      const result = await upsertClient({ id: client?.id, ...values });
      if (result.error) {
        toast({
          title: "Error al guardar",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente guardado",
        description: `${values.contact_name} quedo registrado correctamente.`,
      });
      onSuccess();
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-5 pb-4 pt-4 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-4">
          {steps.map((item, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-left transition",
                  isActive && "border-primary bg-primary/10",
                  isCompleted && "border-primary/30 bg-primary/5",
                  !isActive && !isCompleted && "border-border/60 bg-muted/30"
                )}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Paso {index + 1}
                </div>
                <div className="mt-1 text-sm font-bold">{item.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              {step.title}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            {currentStep === 0 ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                {stepSummary.map(item => (
                  <span key={item} className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Form {...form}>
            <form id="upsert-client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 0 ? (
                <section className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre y apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del cliente" className="h-12 rounded-2xl" {...field} />
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
                          <Input type="email" placeholder="cliente@email.com" className="h-12 rounded-2xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agreement_id"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Convenio comercial</FormLabel>
                        <Select onValueChange={value => field.onChange(value === "__none__" ? null : value)} value={field.value ?? "__none__"}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-2xl">
                              <SelectValue placeholder="Seleccione un convenio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Ninguno por ahora</SelectItem>
                            {agreements.map(agreement => (
                              <SelectItem key={agreement.id} value={agreement.id}>
                                {agreement.agreement_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Si lo asignas ahora, el cliente puede quedar listo para comprar apenas termines.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              ) : null}

              {currentStep === 1 ? (
                <section className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fiscal_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condicion fiscal</FormLabel>
                        <Select onValueChange={value => field.onChange(value === "__none__" ? "" : value)} value={field.value || "__none__"}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-2xl">
                              <SelectValue placeholder="Seleccione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Sin especificar</SelectItem>
                            <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                            <SelectItem value="Monotributista">Monotributista</SelectItem>
                            <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
                            <SelectItem value="Exento">Exento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cuit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CUIT</FormLabel>
                        <FormControl>
                          <Input placeholder="11 digitos sin guiones" className="h-12 rounded-2xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_dni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNI</FormLabel>
                        <FormControl>
                          <Input placeholder="Sin puntos" className="h-12 rounded-2xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" className="h-12 rounded-2xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              ) : null}

              {currentStep === 2 ? (
                <section className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                          <Select onValueChange={value => field.onChange(value === "__none__" ? "" : value)} value={field.value || "__none__"}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <ScrollArea className="h-60">
                                <SelectItem value="__none__">Sin provincia</SelectItem>
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
                        <FormLabel>Localidad</FormLabel>
                          <Select
                            onValueChange={value => field.onChange(value === "__none__" ? "" : value)}
                            value={field.value || "__none__"}
                            disabled={!watchedProvince || watchedProvince === "__none__"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder={watchedProvince ? "Seleccione localidad" : "Primero elige provincia"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <ScrollArea className="h-60">
                                <SelectItem value="__none__">Sin localidad</SelectItem>
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="street_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calle</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Av. Corrientes" className="h-12 rounded-2xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="street_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numero</FormLabel>
                          <FormControl>
                            <Input placeholder="1234" className="h-12 rounded-2xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              ) : null}

              {currentStep === 3 ? (
                <section className="space-y-4">
                  <FormField
                    control={form.control}
                    name="delivery_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dias de entrega</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {deliveryDays.map(day => {
                              const isSelected = field.value?.includes(day.id);
                              return (
                                <Button
                                  key={day.id}
                                  type="button"
                                  variant={isSelected ? "default" : "outline"}
                                  className={cn("h-11 w-11 rounded-2xl p-0", !isSelected && "border-border/60")}
                                  onClick={() => {
                                    const nextValue = isSelected
                                      ? field.value?.filter(value => value !== day.id)
                                      : [...(field.value || []), day.id];
                                    field.onChange(nextValue);
                                  }}
                                >
                                  {day.label}
                                </Button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Opcional, pero muy util para dejar clara la logistica del cliente.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="delivery_time_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desde</FormLabel>
                          <Select onValueChange={value => field.onChange(value === "__none__" ? "" : value)} value={field.value || "__none__"}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder="Horario inicial" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">Sin definir</SelectItem>
                              {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="delivery_time_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hasta</FormLabel>
                          <Select onValueChange={value => field.onChange(value === "__none__" ? "" : value)} value={field.value || "__none__"}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder="Horario final" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">Sin definir</SelectItem>
                              {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              ) : null}
            </form>
          </Form>
        </div>
      </ScrollArea>

      <DialogFooter className="border-t border-border/60 px-5 py-4 sm:px-6">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Paso {currentStep + 1} de {steps.length}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                if (currentStep === 0) {
                  onCancel();
                  return;
                }
                setCurrentStep(previous => Math.max(previous - 1, 0));
              }}
              className="h-11 rounded-2xl"
            >
              Volver
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={goNext} className="h-11 rounded-2xl">
                Continuar
              </Button>
            ) : (
              <Button
                type="submit"
                form="upsert-client-form"
                disabled={isPending}
                className="h-11 rounded-2xl"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending ? "Guardando..." : client ? "Guardar cambios" : "Crear cliente"}
              </Button>
            )}
          </div>
        </div>
      </DialogFooter>
    </div>
  );
}
