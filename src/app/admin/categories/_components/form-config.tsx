"use client";

import { useTransition, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createCategory, updateCategory, deleteCategory } from "../actions/categories.actions";
import type { Category } from "@/types";

const formSchema = z.object({
  slug: z.string().min(1, "Slug es requerido").max(50),
  name: z.string().min(1, "Nombre es requerido").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional(),
  sort_order: z.number().int().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess: () => void;
}

export function CategoryDialog({ open, onOpenChange, category, onSuccess }: CategoryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: category?.slug ?? "",
      name: category?.name ?? "",
      description: category?.description ?? "",
      icon: category?.icon ?? "",
      color: category?.color ?? "#6366f1",
      sort_order: category?.sort_order ?? 0,
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const payload = category 
        ? { id: category.id, name: data.name, slug: data.slug, description: data.description, icon: data.icon, color: data.color, sort_order: data.sort_order }
        : { name: data.name, slug: data.slug, description: data.description, icon: data.icon, color: data.color, sort_order: data.sort_order };
      const result = await createCategory(payload as any);

      if (result.success) {
        toast({ title: category ? "Categoría actualizada" : "Categoría creada", variant: "success" });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: result.error?.message ?? "Error", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!category) return;
    setIsDeleteLoading(true);
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      setIsDeleteLoading(false);
      if (result.success) {
        toast({ title: "Categoría eliminada", variant: "success" });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: result.error?.message ?? "Error", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar" : "Nueva"} Categoría</DialogTitle>
          <DialogDescription>
            {category ? "Edita los detalles de la categoría" : "Crea una nueva categoría de productos"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input {...form.register("slug")} placeholder="cabello" />
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input {...form.register("name")} placeholder="Cabello" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input {...form.register("description")} placeholder="Productos para el cuidado del cabello" />
            </div>
            <div>
              <label className="text-sm font-medium">Icono</label>
              <Input {...form.register("icon")} placeholder="💇" />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <Input type="color" {...form.register("color")} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-medium">Orden</label>
              <Input type="number" {...form.register("sort_order", { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {category && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleteLoading}
              >
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {category ? "Guardar" : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CreateCategoryTriggerProps {
  children: React.ReactNode;
  onClick: () => void;
}

export function CreateCategoryTrigger({ children, onClick }: CreateCategoryTriggerProps) {
  return (
    <button onClick={onClick} className="btn-primary">
      {children}
    </button>
  );
}