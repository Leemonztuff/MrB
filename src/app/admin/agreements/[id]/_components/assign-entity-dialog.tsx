
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { EntityDialog, type FormConfig } from "../../../_components/entity-dialog";

type Entity = { id: string; [key: string]: any };

type AssignEntityDialogProps<T extends Entity> = {
  children: React.ReactNode;
  agreementId: string;
  entityName: string;
  entityNamePlural: string;
  getUnassignedEntitiesAction: (agreementId: string) => Promise<{ data: T[] | null, error: any }>;
  assignAction: (payload: { agreement_id: string; [key: string]: string[] }) => Promise<{ error: any }>;
  assignPayloadKey: string;
  renderItem: (item: T) => React.ReactNode;
  creationFormConfig: FormConfig<any>;
};

export function AssignEntityDialog<T extends Entity>({
  children,
  agreementId,
  entityName,
  entityNamePlural,
  getUnassignedEntitiesAction,
  assignAction,
  assignPayloadKey,
  renderItem,
  creationFormConfig,
}: AssignEntityDialogProps<T>) {

  const assignSchema = z.object({
    ids: z.array(z.string()).nonempty(`Debes seleccionar al menos ${entityName.toLowerCase()}.`),
  });
  
  type AssignFormValues = z.infer<typeof assignSchema>;
  
  const [isOpen, setIsOpen] = useState(false);
  const [entities, setEntities] = useState<T[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, startLoading] = useTransition();
  const { toast } = useToast();

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { ids: [] },
  });
  
  const selectedIds = form.watch("ids");

  const fetchUnassignedEntities = useCallback(async () => {
    startLoading(async () => {
        const { data, error } = await getUnassignedEntitiesAction(agreementId);
        if (error) {
          toast({ title: "Error", description: `No se pudieron cargar ${entityNamePlural.toLowerCase()}.`, variant: "destructive" });
        } else {
          setEntities(data ?? []);
        }
      });
  }, [agreementId, toast, getUnassignedEntitiesAction, entityNamePlural]);

  useEffect(() => {
    if (isOpen) {
      fetchUnassignedEntities();
    }
  }, [isOpen, fetchUnassignedEntities]);


  const onSubmit = (values: AssignFormValues) => {
    startTransition(async () => {
      const payload = {
        agreement_id: agreementId,
        [assignPayloadKey]: values.ids,
      };
      const result = await assignAction(payload);
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: `${values.ids.length} ${entityNamePlural.toLowerCase()} asignada(s) correctamente.` });
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const handleNewEntitySuccess = useCallback(async (newEntity: T) => {
      await fetchUnassignedEntities();
      form.setValue('ids', [...(form.getValues().ids || []), newEntity.id], { shouldValidate: true });
  }, [fetchUnassignedEntities, form]);

  const upsertActionWithCallback = useCallback(async (payload: any) => {
    const result = await creationFormConfig.upsertAction(payload);
    if (!result.error && result.data) {
        await handleNewEntitySuccess(result.data);
    }
    return result;
  }, [handleNewEntitySuccess, creationFormConfig]);

  const newEntityDialogConfig: FormConfig<any> = {
      ...creationFormConfig,
      upsertAction: upsertActionWithCallback,
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) form.reset();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar {entityNamePlural}</DialogTitle>
          <DialogDescription>
            Selecciona una o más {entityNamePlural.toLowerCase()} para aplicar a este convenio.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-end gap-2 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div> : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ids"
              render={() => (
                <FormItem>
                  <div className="flex justify-between items-center pr-2">
                    <FormLabel>{entityNamePlural} Disponibles</FormLabel>
                    <EntityDialog formConfig={newEntityDialogConfig} entity={undefined}>
                       <Button variant="link" size="sm" type="button" className="p-1 h-auto text-xs">
                          Crear Nueva
                      </Button>
                    </EntityDialog>
                  </div>
                   <ScrollArea className="h-60 border rounded-md">
                     <div className="p-1">
                      {entities.length > 0 ? entities.map(entity => (
                           <FormField
                              key={entity.id}
                              control={form.control}
                              name="ids"
                              render={({ field }) => (
                                <FormItem
                                  key={entity.id}
                                  className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md hover:bg-muted/50 data-[state=checked]:bg-secondary"
                                  data-state={field.value?.includes(entity.id) ? "checked" : "unchecked"}
                                >
                                  <FormControl>
                                    <Checkbox
                                      id={`checkbox-${entityName}-${entity.id}`}
                                      checked={field.value?.includes(entity.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), entity.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== entity.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <label
                                    htmlFor={`checkbox-${entityName}-${entity.id}`}
                                    className="w-full font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                      {renderItem(entity)}
                                  </label>
                                </FormItem>
                              )}
                            />
                      )) : <p className="p-4 text-center text-sm text-muted-foreground">No hay más {entityNamePlural.toLowerCase()} para asignar.</p>}
                      </div>
                    </ScrollArea>
                  <FormMessage className="pt-2" />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending || selectedIds.length === 0}>
                {isPending ? "Asignando..." : `Asignar ${selectedIds.length} ${entityNamePlural}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
