
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
import { Promotion } from "@/types";
import { deletePromotion } from "@/app/admin/actions/promotions.actions";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { EntityDialog } from "../../_components/entity-dialog";
import { promotionFormConfig } from "./form-config";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const formatRule = (rules: any): string => {
  if (!rules || typeof rules !== 'object') {
    return 'Regla no definida';
  }

  switch (rules.type) {
    case 'buy_x_get_y_free':
      return `Llevando ${rules.buy || 'X'} unidades, obtienes ${rules.get || 'Y'} de regalo.`;
    case 'free_shipping':
      return `Envío gratis con ${rules.min_units || 'X'} unidades o más.`;
    case 'min_amount_discount':
      return `${rules.percentage || 'X'}% OFF en compras superiores a ${formatCurrency(rules.min_amount || 0)}.`;
    default:
      return 'Regla personalizada.';
  }
};

interface PromotionsTableProps {
  promotions: Promotion[];
  emptyState: React.ReactNode;
}

export default function PromotionsTable({ promotions, emptyState }: PromotionsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (promotionId: string) => {
    startTransition(async () => {
      const result = await deletePromotion(promotionId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Promoción eliminada correctamente.",
        });
      }
    });
  };

  if (promotions.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile View */}
      <div className="grid gap-3 sm:hidden">
        {promotions.map((promotion) => (
          <Card key={promotion.id} className="glass border-white/5 hover:bg-white/5 transition-all duration-300">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-xl font-black italic tracking-tighter leading-none">{promotion.name}</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">{promotion.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-[10px] bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                <p className="font-black uppercase tracking-widest text-primary mb-1">Regla Aplicada</p>
                <p className="text-muted-foreground font-medium italic">{formatRule(promotion.rules)}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-3 p-4 pt-0">
              <EntityDialog formConfig={promotionFormConfig} entity={promotion}>
                <Button variant="secondary" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/5 border-white/5 hover:bg-white/10">
                  <Edit className="mr-2 h-3.5 w-3.5" /> Editar
                </Button>
              </EntityDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-xl">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass border-white/5">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-black italic">¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      Esta acción no se puede deshacer. Esto eliminará permanentemente la promoción.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(promotion.id)}
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
      <div className="hidden sm:block">
        <div className="p-0 glass border-white/5 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-6">Nombre</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Descripción</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Regla</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Creada el</TableHead>
                <TableHead className="text-right pr-6">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => (
                <TableRow key={promotion.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="pl-6 py-4 font-black italic tracking-tighter text-base group-hover:text-primary transition-colors">{promotion.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-medium italic truncate max-w-[200px]">
                    {promotion.description}
                  </TableCell>
                  <TableCell className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                    {formatRule(promotion.rules)}
                  </TableCell>
                  <TableCell className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {formatDate(promotion.created_at)}
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
                        <EntityDialog formConfig={promotionFormConfig} entity={promotion}>
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
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la promoción.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(promotion.id)}
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
          Mostrando <strong className="text-foreground">{promotions.length}</strong> de{" "}
          <strong className="text-foreground">{promotions.length}</strong> promociones
        </div>
      </div>
    </>
  );
}
