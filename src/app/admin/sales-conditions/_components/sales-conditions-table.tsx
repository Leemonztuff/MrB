
"use client";

import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useTransition } from "react";
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
import { SalesCondition } from "@/types";
import { deleteSalesCondition } from "@/app/admin/actions/sales-conditions.actions";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { EntityDialog } from "../../_components/entity-dialog";
import { salesConditionFormConfig } from "./form-config";

const formatRule = (rules: any): string => {
  if (!rules || typeof rules !== 'object') {
    return 'Regla no definida';
  }

  const { type, days, percentage, installments, initial_percentage, remaining_days } = rules;

  switch (type) {
    case 'net_days':
      return `Plazo de pago: ${days || 'N/D'} días netos.`;
    case 'discount':
      return `Descuento por pronto pago: ${percentage || 'N/D'}%.`;
    case 'installments':
        return `Financiación: ${installments || 'N/D'} cuotas.`;
    case 'split_payment':
        return `${initial_percentage || 'N/D'}% de adelanto, resto a ${remaining_days || 'N/D'} días.`;
    case 'cash_on_delivery':
        return `Pago al momento de la entrega.`;
    default:
      return 'Regla personalizada.';
  }
};


interface SalesConditionsTableProps {
    salesConditions: SalesCondition[];
    emptyState: React.ReactNode;
}

export default function SalesConditionsTable({ salesConditions, emptyState }: SalesConditionsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteSalesCondition(id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Condición de venta eliminada correctamente.",
        });
      }
    });
  };

  if (salesConditions.length === 0) {
    return <>{emptyState}</>;
  }
  
  return (
    <>
      {/* Mobile View */}
      <div className="grid gap-4 sm:hidden">
        {salesConditions.map((condition) => (
          <Card key={condition.id}>
            <CardHeader>
              <CardTitle>{condition.name}</CardTitle>
              <CardDescription>{condition.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm bg-muted/50 p-3 rounded-md text-muted-foreground">
                  <p className="font-semibold text-foreground">Regla Aplicada:</p>
                  <p>{formatRule(condition.rules)}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <EntityDialog formConfig={salesConditionFormConfig} entity={condition}>
                  <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/> Editar</Button>
                </EntityDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Eliminar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Estás seguro?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la condición.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(condition.id)}
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
      
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Regla</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesConditions.map((condition) => (
                <TableRow key={condition.id}>
                  <TableCell className="font-medium">{condition.name}</TableCell>
                  <TableCell>
                    {condition.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                      {formatRule(condition.rules)}
                  </TableCell>
                  <TableCell>
                    {formatDate(condition.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <EntityDialog formConfig={salesConditionFormConfig} entity={condition}>
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
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la condición.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(condition.id)}
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
        </div>
        <div className="text-xs text-muted-foreground pt-4">
          Mostrando <strong>{salesConditions.length}</strong> de{" "}
          <strong>{salesConditions.length}</strong> condiciones.
        </div>
      
    </>
  );
}
