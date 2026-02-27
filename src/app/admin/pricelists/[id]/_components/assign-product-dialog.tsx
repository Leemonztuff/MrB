

"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getUnassignedProductsForPriceList, assignProductsToPriceList } from "@/app/admin/actions/pricelists.actions";
import type { Product } from "@/types";
import { getImageUrl } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { EntityDialog } from "../../../_components/entity-dialog";
import { productFormConfig } from "../../../products/_components/form-config";
import type { FormConfig } from "../../../_components/entity-dialog";

const assignSchema = z.object({
  product_ids: z.array(z.string()).nonempty("Debes seleccionar al menos un producto."),
});

type AssignFormValues = z.infer<typeof assignSchema>;

export function AssignProductToPriceListDialog({
  children,
  priceListId,
}: {
  children: React.ReactNode;
  priceListId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, startLoading] = useTransition();
  const { toast } = useToast();

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      product_ids: [],
    },
  });

  const { setValue } = form;
  const selectedProductIds = form.watch("product_ids");

  const fetchUnassignedProducts = useCallback(async () => {
    startLoading(async () => {
        const { data, error } = await getUnassignedProductsForPriceList(priceListId);
        if (error) {
            toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
        } else {
            setProducts(data ?? []);
        }
    });
  }, [priceListId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchUnassignedProducts();
    }
  }, [isOpen, fetchUnassignedProducts]);

  const onSubmit = (values: AssignFormValues) => {
    startTransition(async () => {
      const selectedProducts = products.filter(p => values.product_ids.includes(p.id));
      const productsToAssign = selectedProducts.map(p => ({
        product_id: p.id,
        price: 0, // Assign with a price of 0, forcing admin to set it.
        volume_price: null,
      }));

      const result = await assignProductsToPriceList({
        price_list_id: priceListId,
        products: productsToAssign,
      });

      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: `${productsToAssign.length} producto(s) asignado(s) correctamente. Recuerda definir sus precios.` });
        setIsOpen(false);
        form.reset();
      }
    });
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setValue('product_ids', products.map(p => p.id) as any);
    } else {
      setValue('product_ids', [] as any);
    }
  };
  
  const handleNewProductSuccess = useCallback(async (newProduct: Product) => {
      await fetchUnassignedProducts();
      setValue('product_ids', [...(form.getValues().product_ids || []), newProduct.id], { shouldValidate: true });
  }, [fetchUnassignedProducts, form, setValue]);

  const upsertActionWithCallback = useCallback(async (payload: any) => {
    const result = await productFormConfig.upsertAction(payload);
    if (!result.error && result.data) {
        await handleNewProductSuccess(result.data);
    }
    return result;
  }, [handleNewProductSuccess]);

  const newProductDialogConfig: FormConfig<any> = {
      ...productFormConfig,
      upsertAction: upsertActionWithCallback,
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Productos a la Lista</DialogTitle>
          <DialogDescription>
            Selecciona los productos para agregar a esta lista. Se añadirán con precio $0, que deberás editar.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-end gap-2 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="product_ids"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between pr-4">
                        <div className="flex items-baseline gap-4">
                           <FormLabel>Productos Disponibles</FormLabel>
                            <EntityDialog formConfig={newProductDialogConfig} entity={undefined}>
                                <Button variant="link" size="sm" type="button" className="p-1 h-auto text-xs">
                                    Crear Nuevo Producto
                                </Button>
                            </EntityDialog>
                        </div>
                        {products.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedProductIds.length === products.length && products.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Seleccionar todos"
                                />
                                <label
                                    htmlFor="select-all"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Seleccionar Todos
                                </label>
                            </div>
                        )}
                    </div>
                    <ScrollArea className="h-72 border rounded-md">
                      <div className="p-1">
                        {products.length > 0 ? (
                          products.map((product) => (
                            <FormField
                              key={product.id}
                              control={form.control}
                              name="product_ids"
                              render={({ field }) => (
                                <FormItem
                                  key={product.id}
                                  className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50 data-[state=checked]:bg-secondary"
                                  data-state={field.value?.includes(product.id) ? "checked" : "unchecked"}
                                >
                                  <FormControl>
                                    <Checkbox
                                      id={`checkbox-${product.id}`}
                                      checked={field.value?.includes(product.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), product.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== product.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <label
                                    htmlFor={`checkbox-${product.id}`}
                                    className="w-full flex items-center gap-4 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    <Image
                                      src={getImageUrl("product_sm", { seed: product.id }, product.image_url)}
                                      alt={product.name}
                                      width={40}
                                      height={40}
                                      className="rounded-md aspect-square object-cover"
                                      data-ai-hint="product image"
                                    />
                                    <div className="flex-grow">
                                      <p>{product.name}</p>
                                      <p className="text-xs text-muted-foreground">{product.category}</p>
                                    </div>
                                  </label>
                                </FormItem>
                              )}
                            />
                          ))
                        ) : (
                          <p className="p-4 text-center text-sm text-muted-foreground">
                            No hay más productos para asignar.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                    <FormMessage className="pt-2" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button" onClick={() => form.reset()}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending || selectedProductIds.length === 0}>
                  {isPending ? "Asignando..." : `Asignar ${selectedProductIds.length} Producto(s)`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
