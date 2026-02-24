"use client";

import { useState, useTransition } from "react";
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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updatePriceListItem } from "@/app/admin/actions/pricelists.actions";
import type { PriceListItem } from "@/types";

const priceSchema = z.object({
  price: z.coerce.number().min(0, "El precio debe ser un número positivo."),
  volume_price: z.coerce.number().optional().nullable(),
});

type PriceFormValues = z.infer<typeof priceSchema>;

export function PriceListItemEditDialog({
  children,
  priceListId,
  item,
}: {
  children: React.ReactNode;
  priceListId: string;
  item: PriceListItem;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      price: item.price,
      volume_price: item.volume_price,
    },
  });

  const onSubmit = (values: PriceFormValues) => {
    startTransition(async () => {
      const result = await updatePriceListItem({ 
          price_list_id: priceListId,
          product_id: item.product_id,
          price: values.price,
          volume_price: values.volume_price ?? null
      });
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: `Precios actualizados correctamente.`,
        });
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Precios</DialogTitle>
          <DialogDescription>
            Establece los precios para <strong>{item.products.name}</strong> en esta lista.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Lista</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="volume_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por Volumen (&gt;150 unidades)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Opcional"
                        {...field}
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value === "" ? null : e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar Precios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
