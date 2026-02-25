
"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Product, Promotion, ActionResponse } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AgreementFormFieldsWrapper } from "../agreements/_components/form-config-wrapper";


export interface FormConfig<T extends z.ZodType<any, any>> {
  entityName: string;
  schema: T;
  upsertAction: (payload: any) => Promise<ActionResponse<any>>;
  getDefaultValues: (entity?: any) => z.infer<T>;
  renderFields: (form: any, props?: any) => React.ReactNode;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

interface EntityDialogProps {
  children: React.ReactElement;
  formConfig: FormConfig<any>;
  entity?: Product | Promotion;
}

export function EntityDialog({
  children,
  formConfig,
  entity,
}: EntityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    entityName,
    schema,
    upsertAction,
    getDefaultValues,
    renderFields,
    wrapper: FormWrapper
  } = formConfig;

  // Use useMemo to avoid re-creating the form object on every render
  const form = useForm({
    resolver: zodResolver(schema),
    // Memoize default values to prevent unnecessary form state updates
    defaultValues: useMemo(() => getDefaultValues(entity), [entity, getDefaultValues]),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultValues(entity));
    }
  }, [isOpen, entity, form, getDefaultValues]);

  const onSubmit = (values: z.infer<any>) => {
    startTransition(async () => {
      const payload = { ...values, id: entity?.id };
      const result = await upsertAction(payload);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: `${entityName} ${entity ? "actualizado" : "creado"} correctamente.`,
        });
        setIsOpen(false);
      }
    });
  };

  const dialogTitle = `${entity ? "Editar" : "Nuevo"} ${entityName}`;
  const dialogDescription = entity
    ? `Actualiza los detalles de este ${entityName.toLowerCase()}.`
    : `Completa los detalles para el nuevo ${entityName.toLowerCase()}.`;

  const renderFormContent = () => {
    if (FormWrapper) {
      return <FormWrapper>{renderFields(form)}</FormWrapper>;
    }
    // Pass an empty object to ensure props are never undefined
    return renderFields(form, {});
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg grid-rows-[auto_1fr_auto] p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full w-full">
          <div className="px-6 pb-6">
            <FormProvider {...form}>
              <form
                id={`entity-form-${entityName}`}
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {renderFormContent()}
              </form>
            </FormProvider>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-2 border-t mt-auto">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form={`entity-form-${entityName}`}
            disabled={isPending}
          >
            {isPending ? "Guardando..." : `Guardar ${entityName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
