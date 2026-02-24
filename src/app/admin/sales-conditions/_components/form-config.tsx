
"use client";

import { z } from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { upsertSalesCondition } from "@/app/admin/actions/sales-conditions.actions";
import type { FormConfig } from "../../_components/entity-dialog";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";


// --- Esquemas de Zod ---
const netDaysSchema = z.object({
  days: z.coerce.number().min(1, "Debe ser al menos 1"),
});

const discountSchema = z.object({
  percentage: z.coerce.number().min(1, "Debe ser al menos 1").max(100, "No puede ser más de 100"),
});

const installmentsSchema = z.object({
    installments: z.coerce.number().min(1, "Debe ser al menos 1"),
});

const splitPaymentSchema = z.object({
    initial_percentage: z.coerce.number().min(1).max(99),
    remaining_days: z.coerce.number().min(1),
});

const salesConditionSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  type: z.enum(["net_days", "discount", "installments", "split_payment", "cash_on_delivery"]),
  rules: z.object({
      net_days: netDaysSchema.optional(),
      discount: discountSchema.optional(),
      installments: installmentsSchema.optional(),
      split_payment: splitPaymentSchema.optional(),
  }),
}).superRefine((data, ctx) => {
    // Valida que las reglas para el tipo seleccionado existan
    if (data.type === 'net_days') {
        const result = netDaysSchema.safeParse(data.rules.net_days);
        if (!result.success) result.error.errors.forEach(err => ctx.addIssue({ ...err, path: ["rules", "net_days", ...err.path] }));
    }
     if (data.type === 'discount') {
        const result = discountSchema.safeParse(data.rules.discount);
        if (!result.success) result.error.errors.forEach(err => ctx.addIssue({ ...err, path: ["rules", "discount", ...err.path] }));
    }
    if (data.type === 'installments') {
        const result = installmentsSchema.safeParse(data.rules.installments);
        if (!result.success) result.error.errors.forEach(err => ctx.addIssue({ ...err, path: ["rules", "installments", ...err.path] }));
    }
     if (data.type === 'split_payment') {
        const result = splitPaymentSchema.safeParse(data.rules.split_payment);
        if (!result.success) result.error.errors.forEach(err => ctx.addIssue({ ...err, path: ["rules", "split_payment", ...err.path] }));
    }
});


// --- Lógica de Procesamiento y Valores por Defecto ---
const getSalesConditionDefaultValues = (entity?: any) => {
  if (!entity) {
    return {
      name: "",
      description: "",
      type: "net_days" as const,
      rules: {
        net_days: { days: 30 },
        discount: { percentage: 5 },
        installments: { installments: 3 },
        split_payment: { initial_percentage: 50, remaining_days: 30 },
      }
    };
  }

  const type = entity.rules?.type || "net_days";
  const rules = entity.rules || {};
  return {
    name: entity.name,
    description: entity.description ?? "",
    type: type,
    rules: {
        net_days: { days: rules.days || 30 },
        discount: { percentage: rules.percentage || 5 },
        installments: { installments: rules.installments || 3 },
        split_payment: { initial_percentage: rules.initial_percentage || 50, remaining_days: rules.remaining_days || 30 },
    }
  };
};

const processPayload = (values: z.infer<typeof salesConditionSchema>) => {
  let ruleDetails: any = {};
  
  if (values.type === "net_days" && values.rules.net_days) {
    ruleDetails = values.rules.net_days;
  } else if (values.type === "discount" && values.rules.discount) {
    ruleDetails = values.rules.discount;
  } else if (values.type === "installments" && values.rules.installments) {
    ruleDetails = values.rules.installments;
  } else if (values.type === "split_payment" && values.rules.split_payment) {
    ruleDetails = values.rules.split_payment;
  }

  return {
    name: values.name,
    description: values.description,
    rules: {
        type: values.type,
        ...ruleDetails
    },
  };
};

// --- Renderizado de Campos ---
const RenderFields = ({ form }: {form: any}) => {
    const selectedType = form.watch("type");

    useEffect(() => {
        // Limpia los valores de las reglas no seleccionadas para evitar conflictos de validación
        const rulesToKeep: any = {};
        if(form.getValues().rules[selectedType]) {
            rulesToKeep[selectedType] = form.getValues().rules[selectedType];
        }
        form.setValue("rules", rulesToKeep, { shouldValidate: true });
    }, [selectedType, form]);

    return (
        <>
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Nombre de la Condición</FormLabel>
                <FormControl>
                <Input placeholder="e.g., Pago a 30 días" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Descripción Breve</FormLabel>
                <FormControl>
                <Input placeholder="El pago total debe realizarse 30 días después de la fecha de la factura." {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Tipo de Condición</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="net_days">Plazo de pago (días)</SelectItem>
                    <SelectItem value="discount">Descuento por pronto pago (%)</SelectItem>
                    <SelectItem value="installments">Financiación (cuotas)</SelectItem>
                    <SelectItem value="split_payment">Pago dividido (adelanto + plazo)</SelectItem>
                    <SelectItem value="cash_on_delivery">Pago Contra Reembolso</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />

        {/* --- Campos Condicionales --- */}
        <div className={cn("space-y-4 p-4 border rounded-md bg-muted/30", selectedType === "net_days" ? "block" : "hidden")}>
            <h4 className="font-medium text-sm">Reglas de "Plazo de pago"</h4>
            <FormField control={form.control} name="rules.net_days.days" render={({ field }) => (
                <FormItem>
                    <FormLabel>Días de Plazo</FormLabel>
                    <FormControl><Input type="number" placeholder="30" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className={cn("space-y-4 p-4 border rounded-md bg-muted/30", selectedType === "discount" ? "block" : "hidden")}>
            <h4 className="font-medium text-sm">Reglas de "Descuento"</h4>
            <FormField control={form.control} name="rules.discount.percentage" render={({ field }) => (
                <FormItem>
                    <FormLabel>Porcentaje de Descuento</FormLabel>
                    <FormControl><Input type="number" placeholder="10" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className={cn("space-y-4 p-4 border rounded-md bg-muted/30", selectedType === "installments" ? "block" : "hidden")}>
            <h4 className="font-medium text-sm">Reglas de "Cuotas"</h4>
            <FormField control={form.control} name="rules.installments.installments" render={({ field }) => (
                <FormItem>
                    <FormLabel>Cantidad de Cuotas</FormLabel>
                    <FormControl><Input type="number" placeholder="3" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>

         <div className={cn("space-y-4 p-4 border rounded-md bg-muted/30", selectedType === "split_payment" ? "block" : "hidden")}>
            <h4 className="font-medium text-sm">Reglas de "Pago Dividido"</h4>
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="rules.split_payment.initial_percentage" render={({ field }) => (
                    <FormItem>
                        <FormLabel>% Adelanto</FormLabel>
                        <FormControl><Input type="number" placeholder="50" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField control={form.control} name="rules.split_payment.remaining_days" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Días Plazo Restante</FormLabel>
                        <FormControl><Input type="number" placeholder="30" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>
        </>
    );
};


// 4. Configuración completa para el formulario
export const salesConditionFormConfig: FormConfig<typeof salesConditionSchema> = {
  entityName: "Condición de Venta",
  schema: salesConditionSchema,
  upsertAction: (values) => upsertSalesCondition(processPayload(values)),
  getDefaultValues: getSalesConditionDefaultValues,
  renderFields: (form: any) => <RenderFields form={form} />,
};
