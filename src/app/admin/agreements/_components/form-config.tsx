"use client";

import { z } from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertAgreement } from "@/app/admin/actions/agreements.actions";
import type { FormConfig } from "../../_components/entity-dialog";
import type { PriceList } from "@/types";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "../../_components/entity-dialog";
import { priceListFormConfig } from "../../pricelists/_components/form-config";
import { AgreementFormFieldsWrapper } from "./form-config-wrapper";

const agreementSchema = z.object({
  agreement_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  client_type: z.enum(["barberia", "distribuidor", "especial"]),
  price_list_id: z.string().nullable(),
});

// We need a new component to handle its own state and props
const AgreementFormFields = ({ form, priceLists = [], onPriceListCreated = () => {} }: { form: any, priceLists: PriceList[], onPriceListCreated: (newPriceList: PriceList) => void }) => {

  const upsertPriceListActionWithCallback = async (payload: any) => {
    const result = await priceListFormConfig.upsertAction(payload);
    if (!result.error && result.data) {
        onPriceListCreated(result.data);
    }
    return result;
  };
  
  const newPriceListDialogConfig: FormConfig<any> = {
      ...priceListFormConfig,
      upsertAction: upsertPriceListActionWithCallback,
  };


  return (
    <>
      <FormField
        control={form.control}
        name="agreement_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del Convenio</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Distribuidores Premium" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="client_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="barberia">Barbería</SelectItem>
                  <SelectItem value="distribuidor">Distribuidor</SelectItem>
                  <SelectItem value="especial">Especial</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price_list_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lista de Precios</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === 'null' ? null : value)} value={field.value ?? 'null'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una lista..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Ninguna</SelectItem>
                  {priceLists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>La lista que define los precios para este convenio.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
       <div className="text-sm">
        <span>¿La lista que buscas no existe?</span>
          <EntityDialog formConfig={newPriceListDialogConfig} entity={undefined}>
             <Button variant="link" size="sm" type="button" className="p-1 h-auto">
                Crear una nueva lista
            </Button>
          </EntityDialog>
      </div>
    </>
  );
};


const getAgreementDefaultValues = (agreement?: any) => ({
  agreement_name: agreement?.agreement_name ?? "",
  client_type: agreement?.client_type ?? "barberia",
  price_list_id: agreement?.price_list_id ?? null,
});


export const agreementFormConfig: FormConfig<typeof agreementSchema> = {
  entityName: "Convenio",
  schema: agreementSchema,
  upsertAction: (values) => upsertAgreement(values),
  getDefaultValues: getAgreementDefaultValues,
  renderFields: (form: any, props: any) => <AgreementFormFields form={form} {...props} />,
  wrapper: AgreementFormFieldsWrapper,
};
