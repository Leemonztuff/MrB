

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
      <div className="grid gap-4 sm:hidden">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-start gap-4">
              <Image
                src={getImageUrl("product", { seed: product.id }, product.image_url)}
                alt={product.name}
                width={64}
                height={64}
                className="rounded-lg aspect-square object-cover"
                data-ai-hint="product image"
              />
              <div className="flex-grow">
                <CardTitle>{product.name}</CardTitle>
                {product.category && (
                  <div className="text-sm text-muted-foreground">
                    <div><Badge variant="outline">{product.category}</Badge></div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            </CardContent>
            <CardFooter className="flex gap-2 p-4 pt-0">
              <EntityDialog formConfig={productFormConfig} entity={product}>
                <Button variant="outline" size="lg" className="flex-1 h-12 text-sm font-semibold">
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
              </EntityDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="lg" className="flex-1 h-12 text-sm font-semibold">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      ¿Estás seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(product.id)}
                      disabled={isPending}
                      className="bg-destructive hover:bg-destructive/90"
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
      <div className="hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">
                  <span className="sr-only">Imagen</span>
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Creado el</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={getImageUrl("product", { seed: product.id }, product.image_url)}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="rounded-md aspect-square object-cover"
                      data-ai-hint="product image"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                    {product.description}
                  </TableCell>
                  <TableCell>
                    {formatDate(product.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <EntityDialog formConfig={productFormConfig} entity={product}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Editar
                          </DropdownMenuItem>
                        </EntityDialog>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                disabled={isPending}
                                className="bg-destructive hover:bg-destructive/90"
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
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Mostrando <strong>{products.length}</strong> de{" "}
            <strong>{products.length}</strong> productos
          </div>
        </CardFooter>
      </div>
    </>
  );
}
