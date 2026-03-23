"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { importProductsLegacy, type ImportProductRow } from "@/app/admin/actions/products.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImportExcelDialog, type ImportColumn, type ImportResult } from "@/components/shared/import-excel-dialog";

const productColumns: ImportColumn[] = [
  { key: "nombre", label: "Nombre del Producto", required: true, sampleValue: "Cera Modeladora" },
  { key: "descripcion", label: "Descripcion", sampleValue: "Cera para peinado modeling" },
  { key: "categoria", label: "Categoria", sampleValue: "Wax" },
  { key: "imagen", label: "URL de Imagen", sampleValue: "https://ejemplo.com/imagen.jpg" },
];

const sampleProducts = [
  { nombre: "Cera Modeladora", descripcion: "Cera fuerte para peinado", categoria: "Wax", imagen: "" },
  { nombre: "Shampoo Volumen", descripcion: "Shampoo con volumen extra", categoria: "Shampoo & Conditioners", imagen: "" },
];

export function ImportProductsDialog() {
  const [open, setOpen] = useState(false);

  const handleImport = async (data: ImportProductRow[]): Promise<ImportResult> => {
    const result = await importProductsLegacy(data);

    if (!result.success) {
      return {
        success: false,
        imported: 0,
        errors: result.error ? [result.error.message] : ["Error desconocido"],
      };
    }

    return {
      success: true,
      imported: result.data?.imported || 0,
      errors: result.data?.errors || [],
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Upload className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Importar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,900px)] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Productos desde Excel
          </DialogTitle>
          <DialogDescription>Sube un archivo CSV o Excel con los datos de tus productos.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            <ImportExcelDialog
              config={{
                entityName: "Productos",
                columns: productColumns,
                sampleData: sampleProducts,
                onImport: handleImport,
              }}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
