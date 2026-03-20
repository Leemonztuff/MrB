"use client";

import { useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { submitOnboardingForm } from "@/app/actions/user.actions";
import type { Client } from "@/types";
import { useRouter } from "next/navigation";
import { provinces, getLocalitiesByProvince } from "@/lib/geo-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  if (!cuit) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El CUIT es requerido." });
    return;
  }

  const validationResult = validateCuit(cuit);
  if (validationResult === true) return;

  if (typeof validationResult === "number") {
    const cuitBase = cuit.slice(0, -1);
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `CUIT invalido. El digito verificador deberia ser ${validationResult}. Quisiste decir ${cuitBase}${validationResult}?`,
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
  fiscal_status: z.string().min(1, "La condicion fiscal es requerida"),
  cuit: cuitSchema,
  contact_name: z.string().min(3, "El nombre es requerido."),
  contact_dni: z.string().min(7, "El DNI debe tener entre 7 y 8 digitos.").max(8, "El DNI debe tener entre 7 y 8 digitos."),
  province: z.string().min(1, "La provincia es requerida."),
  locality: z.string().min(1, "La localidad es requerida."),
  street_address: z.string().min(3, "La calle es requerida."),
  street_number: z.string().min(1, "El numero es requerido."),
  delivery_days: z.array(z.string()).refine(value => value.some(Boolean), {
    message: "Debes seleccionar al menos un dia de entrega.",
  }),
  delivery_time_from: z.string().min(1, "La hora de inicio es requerida."),
  delivery_time_to: z.string().min(1, "La hora de fin es requerida."),
  email: z.string().email("Debe ser un email valido."),
  instagram: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof formSchema>;

type StepId = "business" | "contact" | "address" | "delivery";

const steps: Array<{
  id: StepId;
  title: string;
  description: string;
  fields: (keyof OnboardingFormValues)[];
}> = [
  {
    id: "business",
    title: "Negocio",
    description: "Datos fiscales y de facturacion.",
    fields: ["fiscal_status", "cuit"],
  },
  {
    id: "contact",
    title: "Contacto",
    description: "Persona responsable y canales de contacto.",
    fields: ["contact_name", "contact_dni", "email", "instagram"],
  },
  {
    id: "address",
    title: "Direccion",
    description: "Ubicacion donde queres recibir los pedidos.",
    fields: ["province", "locality", "street_address", "street_number"],
  },
  {
    id: "delivery",
    title: "Entrega",
    description: "Dias y horarios para que la logistica salga bien.",
    fields: ["delivery_days", "delivery_time_from", "delivery_time_to"],
  },
] as const;

export function OnboardingForm({ client }: { client: Client }) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fiscal_status: client.fiscal_status ?? "",
      cuit: client.cuit ?? "",
      contact_name: client.contact_name?.startsWith("Cliente Pendiente") ? "" : client.contact_name ?? "",
      contact_dni: client.contact_dni ?? "",
      province: "",
      locality: "",
      street_address: "",
      street_number: "",
      delivery_days: ["lunes", "miercoles", "viernes"],
      delivery_time_from: "09:00",
      delivery_time_to: "18:00",
      email: client.email ?? "",
      instagram: client.instagram ?? "",
    },
  });

  const watchedProvince = form.watch("province");
  const watchedName = form.watch("contact_name");
  const watchedEmail = form.watch("email");
  const availableLocalities = watchedProvince ? getLocalitiesByProvince(watchedProvince) : [];
  const step = steps[currentStep];

  useEffect(() => {
    const currentLocality = form.getValues("locality");
    if (availableLocalities.length > 0 && currentLocality && !availableLocalities.includes(currentLocality)) {
      form.setValue("locality", "");
    }
  }, [watchedProvince, availableLocalities, form]);

  const goNext = async () => {
    const isValid = await form.trigger(step.fields);
    if (!isValid) return;
    setCurrentStep(previous => {
      const nextStep = Math.min(previous + 1, steps.length - 1);
      setFurthestStep(current => Math.max(current, nextStep));
      return nextStep;
    });
  };

  const handleStepClick = (index: number) => {
    if (index <= furthestStep) {
      setCurrentStep(index);
      return;
    }

    toast({
      title: "Completa el paso actual",
      description: "Vamos paso a paso para que no se pierda informacion importante.",
    });
  };

  const onSubmit = (values: OnboardingFormValues) => {
    startTransition(async () => {
      const result = await submitOnboardingForm({
        ...values,
        onboarding_token: client.onboarding_token,
      });

      if (result.error) {
        toast({
          title: "Error al enviar",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Formulario enviado",
        description: "Tus datos fueron guardados correctamente.",
      });

      const statusParam = result.data?.status ? `&status=${result.data.status}` : "";
      const agreementId = result.data?.agreement_id ?? client.agreement_id;
      const agreementParam = agreementId ? `&agreement=${agreementId}` : "";
      router.push(`/onboarding/${client.onboarding_token}?success=true${statusParam}${agreementParam}`);
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 pb-4">
        <div className="grid gap-2 sm:grid-cols-4">
          {steps.map((item, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleStepClick(index)}
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
        <div className="space-y-6 py-6">
          <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              {step.title}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            {currentStep > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {[watchedName || "Sin nombre", watchedEmail || "Sin email"].map(item => (
                  <span key={item} className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <Form {...form}>
            <form id="public-onboarding-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 0 ? (
                <section className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fiscal_status"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Condicion fiscal</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-2xl">
                              <SelectValue placeholder="Selecciona tu condicion frente al IVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>CUIT de la barberia o distribuidora</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 20123456789" className="h-12 rounded-2xl" {...field} />
                        </FormControl>
                        <FormDescription>11 digitos, sin guiones.</FormDescription>
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
                    name="contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre y apellido de contacto</FormLabel>
                        <FormControl>
                          <Input className="h-12 rounded-2xl" {...field} />
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
                        <FormLabel>DNI de contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="Sin puntos" className="h-12 rounded-2xl" {...field} />
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
                          <Input type="email" placeholder="tu@email.com" className="h-12 rounded-2xl" {...field} />
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
                        <FormDescription>Opcional.</FormDescription>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder="Selecciona una provincia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                          <FormLabel>Localidad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!watchedProvince}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder={watchedProvince ? "Selecciona una localidad" : "Primero elige provincia"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                            <Input placeholder="Ej: 1234" className="h-12 rounded-2xl" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder="Horario inicial" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder="Horario final" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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

      <div className="border-t border-border/60 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Paso {currentStep + 1} de {steps.length}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-2xl"
              onClick={() => setCurrentStep(previous => Math.max(previous - 1, 0))}
              disabled={currentStep === 0}
            >
              Volver
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" className="h-11 rounded-2xl" onClick={goNext}>
                Continuar
              </Button>
            ) : (
              <Button type="submit" form="public-onboarding-form" disabled={isPending} className="h-11 rounded-2xl">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending ? "Enviando..." : "Enviar datos"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
