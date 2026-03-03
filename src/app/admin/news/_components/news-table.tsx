"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, Edit, Eye, EyeOff, ImageIcon } from "lucide-react";
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
import { NewsPost } from "@/types";
import { deleteNews, updateNews } from "@/app/admin/actions/news.actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NewsForm } from "./news-form";

interface NewsTableProps {
  news: NewsPost[];
}

export default function NewsTable({ news }: NewsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null);
  const router = useRouter();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteNews(id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Noticia eliminada correctamente.",
        });
        router.refresh();
      }
    });
  };

  const handleToggleActive = (newsItem: NewsPost) => {
    startTransition(async () => {
      const result = await updateNews(newsItem.id, { is_active: !newsItem.is_active });
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: newsItem.is_active ? "Noticia ocultada." : "Noticia publicada.",
        });
        router.refresh();
      }
    });
  };

  if (news.length === 0) {
    return null;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="w-[80px]">Imagen</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-[100px]">Estado</TableHead>
            <TableHead className="w-[100px]">Orden</TableHead>
            <TableHead className="w-[150px]">Fechas</TableHead>
            <TableHead className="w-[80px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {news.map((item) => (
            <TableRow key={item.id} className="hover:bg-white/5 border-white/5">
              <TableCell>
                {item.image_url ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>
                {(() => {
                  const isExpired = item.ends_at && new Date(item.ends_at) < new Date();
                  const isScheduled = item.starts_at && new Date(item.starts_at) > new Date();

                  if (!item.is_active) {
                    return (
                      <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 border-slate-500/20">
                        Inactiva
                      </Badge>
                    );
                  }

                  if (isExpired) {
                    return (
                      <Badge variant="outline" className="text-destructive border-destructive/50 bg-destructive/5">
                        Caducada
                      </Badge>
                    );
                  }

                  if (isScheduled) {
                    return (
                      <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 bg-yellow-500/5">
                        Programada
                      </Badge>
                    );
                  }

                  return (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Activa
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell>{item.display_order}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.starts_at || item.ends_at ? (
                  <div className="text-xs">
                    {item.starts_at && (
                      <div>Inicio: {format(new Date(item.starts_at), "dd/MM/yy", { locale: es })}</div>
                    )}
                    {item.ends_at && (
                      <div>Fin: {format(new Date(item.ends_at), "dd/MM/yy", { locale: es })}</div>
                    )}
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditingNews(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                      {item.is_active ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Publicar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar noticia?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La noticia será eliminada permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
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

      <Dialog open={!!editingNews} onOpenChange={(open) => !open && setEditingNews(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar noticia</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de esta noticia.
            </DialogDescription>
          </DialogHeader>
          <NewsForm
            news={editingNews || undefined}
            onClose={() => {
              setEditingNews(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
