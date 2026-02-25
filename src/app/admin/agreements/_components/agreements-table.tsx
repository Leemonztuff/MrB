"use client";

import { useTransition, useCallback } from "react";
import Link from 'next/link';
import { MoreHorizontal, Trash2, FileText, Copy, Edit } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteAgreement } from "@/app/admin/actions/agreements.actions";
import type { AgreementWithCount } from "@/types";
import { EntityDialog } from "../../_components/entity-dialog";
import { agreementFormConfig } from "../_components/form-config";

interface AgreementsTableProps {
  agreements: AgreementWithCount[];
  emptyState: React.ReactNode;
}

export default function AgreementsTable({ agreements, emptyState }: AgreementsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (agreementId: string) => {
    startTransition(async () => {
      const result = await deleteAgreement(agreementId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Convenio eliminado correctamente.",
        });
      }
    });
  };

  if (agreements.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="grid gap-3 sm:hidden">
        {agreements.map((agreement) => (
          <Card key={agreement.id} className="glass border-white/5 hover:bg-white/5 transition-all duration-300">
            <CardHeader className="pb-3 text-center">
              <div className="flex flex-col gap-1 items-center">
                <Badge variant="outline" className="w-fit text-[8px] uppercase font-black tracking-widest py-0 px-2 bg-primary/5 border-primary/20 text-primary mb-1">
                  {agreement.client_type}
                </Badge>
                <CardTitle className="text-xl font-black italic tracking-tighter leading-none">{agreement.agreement_name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pb-4">
              <div className="text-center">
                <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1">Lista de Precios</p>
                <p className="font-headline font-black text-primary text-sm truncate">{agreement.price_lists?.name ?? "Base"}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1">Promociones</p>
                <p className="font-headline font-black text-foreground text-sm">{agreement.promotion_count ?? 0}</p>
              </div>
              <div className="text-center col-span-2 pt-2 border-t border-white/5">
                <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1">Condiciones de Venta</p>
                <p className="font-headline font-black text-foreground text-sm">{agreement.sales_condition_count ?? 0}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3 p-4 pt-0">
              <Button asChild variant="default" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10">
                <Link href={`/admin/agreements/${agreement.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Gestionar Convenio
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <EntityDialog formConfig={agreementFormConfig} entity={agreement}>
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
                        Esta acción no se puede deshacer. Eliminará permanentemente el convenio y sus reglas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(agreement.id)}
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

      {/* Desktop View: Table */}
      <Card className="hidden sm:block glass border-white/5 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-6">Nombre del Convenio</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-center">Tipo Cliente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-center">Lista Precios</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-center">Promos</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-center">Condiciones</TableHead>
                <TableHead className="text-right pr-6">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((agreement) => (
                <TableRow key={agreement.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="pl-6 py-4">
                    <Link href={`/admin/agreements/${agreement.id}`} className="font-black italic tracking-tighter text-base hover:text-primary transition-colors">
                      {agreement.agreement_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center group-hover:scale-105 transition-transform">
                    <Badge variant="outline" className="text-[8px] uppercase font-black tracking-widest py-0.5 px-2 bg-primary/5 border-primary/20 text-primary">
                      {agreement.client_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-headline font-black text-primary/80">
                    {agreement.price_lists?.name ?? <span className="text-muted-foreground/40 font-normal italic">Ninguna</span>}
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-black uppercase tracking-widest text-foreground/80">{agreement.promotion_count ?? 0}</TableCell>
                  <TableCell className="text-center text-[10px] font-black uppercase tracking-widest text-foreground/80">{agreement.sales_condition_count ?? 0}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/5 min-w-[170px]">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Acciones</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="focus:bg-white/5">
                            <Link href={`/admin/agreements/${agreement.id}`} className="cursor-pointer font-bold py-2">
                              <FileText className="mr-2 h-4 w-4 text-primary" />
                              Gestionar
                            </Link>
                          </DropdownMenuItem>
                          <EntityDialog formConfig={agreementFormConfig} entity={agreement}>
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
                                  Esta acción no se puede deshacer. Eliminará permanentemente el convenio y sus asignaciones.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(agreement.id)}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="px-6 py-4 border-t border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Mostrando <strong className="text-foreground">{agreements.length}</strong> de{" "}
            <strong className="text-foreground">{agreements.length}</strong> convenios.
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
