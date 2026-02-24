
"use client";

import { z } from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertPriceList } from "@/app/admin/actions/pricelists.actions";
import type { FormConfig } from "../../_components/entity-dialog";

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  prices_include_vat: z.boolean().default(true),
});

const getDefaultValues = (priceList?: any) => ({
  name: priceList?.name ?? "",
  prices_include_vat: priceList?.prices_include_vat ?? true,
});

const renderFields = (form: any) => (
  <>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre</FormLabel>
          <FormControl>
            <Input placeholder="e.g., Precios Barbería Enero 2024" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="prices_include_vat"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>
              Los precios de esta lista incluyen IVA
            </FormLabel>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  </>
);

export const priceListFormConfig: FormConfig<typeof formSchema> = {
  entityName: "Lista de Precios",
  schema: formSchema,
  upsertAction: upsertPriceList,
  getDefaultValues: getDefaultValues,
  renderFields: renderFields,
};
