

"use client";

import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useTransition } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "@/types";
import { deleteProduct } from "@/app/admin/actions/products.actions";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { getImageUrl } from "@/lib/placeholder-images";
import { EntityDialog } from "../../_components/entity-dialog";
import { productFormConfig } from "./form-config";

interface ProductsTableProps {
  products: Product[];
  emptyState: React.ReactNode;
}

export default function ProductsTable({ products, emptyState }: ProductsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (productId: string) => {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Producto eliminado correctamente.",
        });
      }
    });
  };

  if (products.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile View */}
      <div className="grid gap-3 sm:hidden">
        {products.map((product) => (
          <Card key={product.id} className="glass border-white/5 hover:bg-white/5 transition-all duration-300 overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 pb-3">
              <div className="relative shrink-0">
                <Image
                  src={getImageUrl("product", { seed: product.id }, product.image_url)}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="rounded-xl aspect-square object-cover border border-white/10 shadow-lg"
                  data-ai-hint="product image"
                />
              </div>
              <div className="flex-grow min-w-0">
                <CardTitle className="text-lg font-black italic tracking-tighter truncate leading-tight">{product.name}</CardTitle>
                {product.category && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-[8px] uppercase font-black tracking-widest py-0 px-2 bg-primary/5 border-primary/20 text-primary">
                      {product.category}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-[10px] text-muted-foreground/80 font-medium line-clamp-2 leading-relaxed italic">
                {product.description || "Sin descripción disponible."}
              </p>
            </CardContent>
            <CardFooter className="flex gap-2 p-4 pt-0">
              <EntityDialog formConfig={productFormConfig} entity={product}>
                <Button variant="secondary" size="sm" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/5 border-white/5 hover:bg-white/10">
                  <Edit className="mr-2 h-3.5 w-3.5" /> Editar
                </Button>
              </EntityDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-xl">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass border-white/5">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-black italic">¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(product.id)}
                      disabled={isPending}
                      className="bg-destructive hover:bg-destructive/90 rounded-xl"
                    >
                      {isPending ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block glass border-white/5 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[80px] pl-6 py-4">
                  <span className="sr-only">Imagen</span>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Nombre</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Descripción</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Creado el</TableHead>
                <TableHead className="text-right pr-6">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="pl-6 py-4">
                    <div className="relative h-12 w-12 shrink-0">
                      <Image
                        src={getImageUrl("product", { seed: product.id }, product.image_url)}
                        alt={product.name}
                        fill
                        className="rounded-lg object-cover border border-white/5 group-hover:border-primary/50 transition-colors shadow-md"
                        data-ai-hint="product image"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-black italic tracking-tighter text-base group-hover:text-primary transition-colors">{product.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground/80 font-medium italic truncate max-w-md">
                    {product.description || "Sin descripción"}
                  </TableCell>
                  <TableCell className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {formatDate(product.created_at)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-white/5 min-w-[160px]">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Acciones</DropdownMenuLabel>
                        <EntityDialog formConfig={productFormConfig} entity={product}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-white/5 cursor-pointer font-bold py-2">
                            <Edit className="mr-2 h-4 w-4 text-primary" />
                            Editar
                          </DropdownMenuItem>
                        </EntityDialog>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold py-2"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass border-white/5">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black italic">
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                disabled={isPending}
                                className="bg-destructive hover:bg-destructive/90 rounded-xl"
                              >
                                {isPending ? "Eliminando..." : "Eliminar"}
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
        </CardContent>
        <CardFooter className="px-6 py-4 border-t border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Mostrando <strong className="text-foreground">{products.length}</strong> de{" "}
            <strong className="text-foreground">{products.length}</strong> productos
          </div>
        </CardFooter>
      </div>
    </>
  );
}
