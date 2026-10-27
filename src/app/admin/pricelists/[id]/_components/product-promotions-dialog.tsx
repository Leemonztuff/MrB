"use client";

import { useState, useTransition } from "react";
import { Gift, Percent } from "lucide-react";
import type { PriceListItem, Promotion } from "@/types";
import { setPriceListProductPromotion } from "@/app/admin/actions/pricelists.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function ProductPromotionsDialog({
  priceListId,
  item,
  promotions,
}: {
  priceListId: string;
  item: PriceListItem;
  promotions: Promotion[];
}) {
  const [open, setOpen] = useState(false);
  const [assignedIds, setAssignedIds] = useState(item.assigned_promotion_ids || []);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const togglePromotion = (promotion: Promotion, assigned: boolean) => {
    startTransition(async () => {
      const result = await setPriceListProductPromotion({
        price_list_id: priceListId,
        product_id: item.product_id,
        promotion_id: promotion.id,
        assigned,
      });

      if (result.error) {
        toast({
          title: "No se pudo actualizar la promoción",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      setAssignedIds(current => assigned
        ? [...new Set([...current, promotion.id])]
        : current.filter(id => id !== promotion.id));
      toast({
        title: "Promociones actualizadas",
        description: `${promotion.name} ${assigned ? "asignada al" : "quitada del"} producto.`,
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          <Gift className="h-4 w-4" />
          <span>Promociones</span>
          {assignedIds.length > 0 && (
            <Badge variant="secondary" className="px-1.5">{assignedIds.length}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Promociones del producto
          </DialogTitle>
          <DialogDescription>
            {item.products.name}. Elegí las promociones compra X y lleva Y habilitadas en convenios que usan esta lista.
          </DialogDescription>
        </DialogHeader>

        {promotions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No hay promociones de este tipo disponibles. Primero asigná una promoción compra X y lleva Y a un convenio que use esta lista de precios.
          </div>
        ) : (
          <div className="space-y-2">
            {promotions.map(promotion => {
              const checked = assignedIds.includes(promotion.id);
              return (
                <label
                  key={promotion.id}
                  className="flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={checked}
                    disabled={isPending}
                    onCheckedChange={value => togglePromotion(promotion, value === true)}
                    aria-label={`${checked ? "Quitar" : "Asignar"} ${promotion.name} a ${item.products.name}`}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{promotion.name}</span>
                      <Badge variant="outline">
                        Compra {promotion.rules.buy} + {promotion.rules.get} gratis
                      </Badge>
                    </span>
                    {promotion.description && (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {promotion.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
