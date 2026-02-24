
"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getAgreements } from "@/app/admin/actions/agreements.actions";
import { assignAgreementToClient } from "@/app/admin/actions/clients.actions";
import type { Client, AgreementWithCount, Agreement } from "@/types";
import { EntityDialog } from "../../_components/entity-dialog";
import { agreementFormConfig } from "../../agreements/_components/form-config";
import type { FormConfig } from "../../_components/entity-dialog";

const formSchema = z.object({
  agreementId: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function AssignAgreementDialog({
  children,
  client,
}: {
  children: React.ReactNode;
  client: Client;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [agreements, setAgreements] = useState<AgreementWithCount[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, startLoading] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreementId: client.agreement_id ?? null,
    },
  });
  
  const fetchAgreements = useCallback(async () => {
     startLoading(async () => {
        const { data } = await getAgreements();
        setAgreements(data ?? []);
      });
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAgreements();
      // Reset form with client's current agreement when opening
      form.reset({ agreementId: client.agreement_id ?? null });
    }
  }, [isOpen, fetchAgreements, client.agreement_id, form]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await assignAgreementToClient({ 
        clientId: client.id, 
        agreementId: values.agreementId 
      });
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Convenio asignado correctamente." });
        setIsOpen(false);
      }
    });
  };

  const handleNewAgreementSuccess = useCallback(async (newAgreement: Agreement) => {
      await fetchAgreements();
      form.setValue('agreementId', newAgreement.id, { shouldValidate: true });
  }, [fetchAgreements, form]);

  const upsertActionWithCallback = useCallback(async (payload: any) => {
    const result = await agreementFormConfig.upsertAction(payload);
    if (!result.error && result.data) {
        await handleNewAgreementSuccess(result.data);
    }
    return result;
  }, [handleNewAgreementSuccess]);

  const newAgreementDialogConfig: FormConfig<any> = {
      ...agreementFormConfig,
      upsertAction: upsertActionWithCallback,
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar Convenio</DialogTitle>
          <DialogDescription>
            Selecciona el convenio comercial para <strong>{client.contact_name || client.email}</strong>.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end gap-2 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div> : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="agreementId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Convenio</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === 'null' ? null : value)} 
                    defaultValue={field.value ?? 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un convenio..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Ninguno (Desactivar)</SelectItem>
                      {agreements.map(agreement => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          {agreement.agreement_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm">
                <span>¿El convenio que buscas no existe?</span>
                <EntityDialog formConfig={newAgreementDialogConfig} entity={undefined}>
                    <Button variant="link" size="sm" type="button" className="p-1 h-auto">
                        o, Crear Nuevo Convenio
                    </Button>
                </EntityDialog>
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar Asignación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
