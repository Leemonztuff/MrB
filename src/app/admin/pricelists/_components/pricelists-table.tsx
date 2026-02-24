
"use client";

import { useTransition } from "react";
import Link from 'next/link';
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deletePriceList } from "@/app/admin/actions/pricelists.actions";
import type { PriceList } from "@/types";
import { formatDate } from "@/lib/utils";
import { EntityDialog } from "../../_components/entity-dialog";
import { priceListFormConfig } from "./form-config";

interface PriceListsTableProps {
    priceLists: PriceList[];
    emptyState: React.ReactNode;
}

export function PriceListsTable({ priceLists, emptyState }: PriceListsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deletePriceList(id);
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Lista de precios eliminada." });
      }
    });
  };

  if (priceLists.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile View */}
      <div className="grid gap-4 sm:hidden">
        {priceLists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle>{list.name}</CardTitle>
              <CardDescription>Creada el {formatDate(list.created_at)}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 items-stretch">
               <Button asChild>
                    <Link href={`/admin/pricelists/${list.id}`}>Gestionar Productos</Link>
                </Button>
                 <EntityDialog formConfig={priceListFormConfig} entity={list}>
                    <Button variant="outline">Editar Nombre</Button>
                </EntityDialog>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Eliminar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Los convenios que usen esta lista quedarán sin precios.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                        onClick={() => handleDelete(list.id)}
                        disabled={isPending}
                        className="bg-destructive hover:bg-destructive/90"
                        >
                        {isPending ? "Eliminando..." : "Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Creada el</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/pricelists/${list.id}`} className="hover:underline">
                      {list.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(list.created_at)}</TableCell>
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
                          <DropdownMenuItem asChild>
                              <Link href={`/admin/pricelists/${list.id}`}>Gestionar Productos</Link>
                          </DropdownMenuItem>
                          <EntityDialog formConfig={priceListFormConfig} entity={list}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar Nombre</DropdownMenuItem>
                          </EntityDialog>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                              </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Los convenios que usen esta lista quedarán sin precios.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                  onClick={() => handleDelete(list.id)}
                                  disabled={isPending}
                                  className="bg-destructive hover:bg-destructive/90"
                                  >
                                  {isPending ? "Eliminando..." : "Confirmar"}
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
        </div>
        <div className="text-xs text-muted-foreground pt-4">
          Mostrando <strong>{priceLists.length}</strong> de <strong>{priceLists.length}</strong> listas.
        </div>
      
    </>
  );
}
