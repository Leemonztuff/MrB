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
    <div className="grid gap-4 sm:hidden">
        {agreements.map((agreement) => (
             <Card key={agreement.id}>
                <CardHeader>
                    <div className="flex flex-col gap-2">
                      <CardTitle>{agreement.agreement_name}</CardTitle>
                       <div className="text-sm text-muted-foreground">
                        <div><Badge variant="outline" className="capitalize">{agreement.client_type}</Badge></div>
                      </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="text-sm">
                        <p className="font-medium">Lista de Precios</p>
                        <p className="text-muted-foreground">{agreement.price_lists?.name ?? "Ninguna"}</p>
                    </div>
                     <div className="text-sm">
                        <p className="font-medium">Promociones</p>
                        <p className="text-muted-foreground">{agreement.promotion_count ?? 0}</p>
                    </div>
                     <div className="text-sm">
                        <p className="font-medium">Condiciones de Venta</p>
                        <p className="text-muted-foreground">{agreement.sales_condition_count ?? 0}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2">
                     <EntityDialog formConfig={agreementFormConfig} entity={agreement}>
                        <Button variant="outline" size="sm" className="w-full"><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                    </EntityDialog>
                    <Button asChild size="sm">
                        <Link href={`/admin/agreements/${agreement.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Gestionar Convenio
                        </Link>
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>
                          ¿Estás seguro?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el convenio y todas sus asignaciones.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                          onClick={() => handleDelete(agreement.id)}
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

    {/* Desktop View: Table */}
    <Card className="hidden sm:block">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Convenio</TableHead>
              <TableHead>Tipo de Cliente</TableHead>
              <TableHead>Lista de Precios</TableHead>
              <TableHead>Promociones</TableHead>
              <TableHead>Condiciones</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/agreements/${agreement.id}`} className="hover:underline">
                    {agreement.agreement_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div><Badge variant="outline" className="capitalize">{agreement.client_type}</Badge></div>
                </TableCell>
                <TableCell>{agreement.price_lists?.name ?? <span className="text-muted-foreground">Ninguna</span>}</TableCell>
                <TableCell>{agreement.promotion_count ?? 0}</TableCell>
                <TableCell>{agreement.sales_condition_count ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
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
                              <Link href={`/admin/agreements/${agreement.id}`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Gestionar
                              </Link>
                          </DropdownMenuItem>
                           <EntityDialog formConfig={agreementFormConfig} entity={agreement}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
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
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el convenio y todas sus asignaciones.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                  onClick={() => handleDelete(agreement.id)}
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
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
         <div className="text-xs text-muted-foreground">
            Mostrando <strong>{agreements.length}</strong> de{" "}
            <strong>{agreements.length}</strong> convenios.
          </div>
      </CardFooter>
    </Card>
    </>
  );
}
