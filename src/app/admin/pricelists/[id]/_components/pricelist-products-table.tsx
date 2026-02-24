

"use client"

import { useTransition } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { PriceListItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { unassignProductFromPriceList } from "@/app/admin/actions/pricelists.actions";
import { useToast } from "@/hooks/use-toast";
import { PriceListItemEditDialog } from "./edit-price-dialog";
import { getImageUrl } from "@/lib/placeholder-images";

export function PriceListProductsTable({ items, priceListId }: { items: PriceListItem[], priceListId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  if (items.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <p>No hay productos en esta lista de precios.</p>
            <p className="text-sm">Usa el botón "Asignar Productos" para empezar.</p>
        </div>
    )
  }

  const handleUnassign = (productId: string) => {
    startTransition(async () => {
      const result = await unassignProductFromPriceList({ price_list_id: priceListId, product_id: productId });
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Producto quitado de la lista." });
      }
    });
  }
  
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[64px] sm:table-cell">
                <span className="sr-only">Imagen</span>
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Precio Lista</TableHead>
            <TableHead>Precio Volumen (&gt;150)</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.products.id}>
              <TableCell className="hidden sm:table-cell">
                 <Image
                    src={getImageUrl("product", { seed: item.products.id }, item.products.image_url)}
                    alt={item.products.name}
                    width={48}
                    height={48}
                    className="rounded-md aspect-square object-cover"
                    data-ai-hint="product image"
                  />
              </TableCell>
              <TableCell className="font-medium">{item.products.name}</TableCell>
              <TableCell>
                <PriceListItemEditDialog 
                  priceListId={priceListId}
                  item={item}
                >
                  <Badge variant="secondary" className="text-base cursor-pointer hover:bg-secondary/80">{formatCurrency(item.price)}</Badge>
                </PriceListItemEditDialog>
              </TableCell>
               <TableCell>
                <PriceListItemEditDialog 
                  priceListId={priceListId}
                  item={item}
                >
                  <Badge variant="outline" className="text-base cursor-pointer hover:bg-muted">{formatCurrency(item.volume_price)}</Badge>
                </PriceListItemEditDialog>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                     <PriceListItemEditDialog 
                        priceListId={priceListId}
                        item={item}
                      >
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar Precios</DropdownMenuItem>
                      </PriceListItemEditDialog>

                    <DropdownMenuSeparator />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Quitar de la lista
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción quitará el producto de esta lista de precios.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnassign(item.products.id)}
                              disabled={isPending}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isPending ? "Quitanto..." : "Confirmar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       <div className="text-xs text-muted-foreground pt-4 px-4">
          Mostrando <strong>{items.length}</strong> de{" "}
          <strong>{items.length}</strong> productos.
        </div>
    </>
  );
}
