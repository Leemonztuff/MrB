"use client";

import { useState } from "react";
import { useTransition } from "react";
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteCategory } from "../actions/categories.actions";
import type { Category } from "@/types";
import { formatDate } from "@/lib/utils";
import { CategoryDialog, CreateCategoryTrigger } from "./form-config";

interface CategoriesTableProps {
  categories: Category[];
  initialCategory?: Category | null;
}

export function CategoriesTable({ categories, initialCategory }: CategoriesTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        toast({ title: "Categoría eliminada", variant: "success" });
        window.location.reload();
      } else {
        toast({ title: result.error?.message ?? "Error", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <CreateCategoryTrigger onClick={handleCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva categoría
      </CreateCategoryTrigger>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        onSuccess={() => window.location.reload()}
      />

      {categories.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">No hay categorías creadas</p>
        </div>
      ) : (
        <div className="card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Orden</TableHead>
                <TableHead className="w-16">Icono</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell className="text-2xl">{category.icon}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {category.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: category.color || '#6366f1' }}
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`badge ${
                        category.is_active ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {category.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(category.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}