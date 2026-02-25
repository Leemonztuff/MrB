
"use client";

import { useTransition } from "react";
import Link from 'next/link';
import { MoreHorizontal, Trash2, Edit, ClipboardList } from "lucide-react";
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
      <div className="grid gap-3 sm:hidden">
        {priceLists.map((list) => (
          <Card key={list.id} className="glass border-white/5 hover:bg-white/5 transition-all duration-300">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-xl font-black italic tracking-tighter leading-none">{list.name}</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Creada el {formatDate(list.created_at)}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3 p-4 pt-0">
              <Button asChild variant="default" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10">
                <Link href={`/admin/pricelists/${list.id}`}>Gestionar Productos</Link>
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <EntityDialog formConfig={priceListFormConfig} entity={list}>
                  <Button variant="secondary" size="sm" className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl bg-white/5 border-white/5 hover:bg-white/10">
                    <Edit className="mr-2 h-3.5 w-3.5" /> Editar
                  </Button>
                </EntityDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 text-[9px] font-black uppercase tracking-widest text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-xl">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass border-white/5">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black italic">¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Esta acción no se puede deshacer. Los convenios que usen esta lista quedarán sin precios.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(list.id)}
                        disabled={isPending}
                        className="bg-destructive hover:bg-destructive/90 rounded-xl"
                      >
                        {isPending ? "Eliminando..." : "Eliminar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <div className="p-0 glass border-white/5 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-6">Nombre de la Lista</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Creada el</TableHead>
                <TableHead className="text-right pr-6">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.map((list) => (
                <TableRow key={list.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="pl-6 py-4">
                    <Link href={`/admin/pricelists/${list.id}`} className="font-black italic tracking-tighter text-base hover:text-primary transition-colors">
                      {list.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{formatDate(list.created_at)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-white/5 min-w-[170px]">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer font-bold py-2">
                          <Link href={`/admin/pricelists/${list.id}`}>
                            <ClipboardList className="mr-2 h-4 w-4 text-primary" />
                            Gestionar Productos
                          </Link>
                        </DropdownMenuItem>
                        <EntityDialog formConfig={priceListFormConfig} entity={list}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-white/5 cursor-pointer font-bold py-2">
                            <Edit className="mr-2 h-4 w-4 text-primary" />
                            Editar Nombre
                          </DropdownMenuItem>
                        </EntityDialog>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold py-2" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass border-white/5">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black italic">¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Esta acción no se puede deshacer. Los convenios que usen esta lista quedarán sin precios.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(list.id)}
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
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-6 py-4">
          Mostrando <strong className="text-foreground">{priceLists.length}</strong> de <strong className="text-foreground">{priceLists.length}</strong> listas.
        </div>
      </div>
    </>
  );
}
