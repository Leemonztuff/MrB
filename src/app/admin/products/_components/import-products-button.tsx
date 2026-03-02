
"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImportExcelDialog, type ImportColumn, type ImportResult } from "@/components/shared/import-excel-dialog";
import { importProducts, type ImportProductRow } from "@/app/admin/actions/products.actions";

const productColumns: ImportColumn[] = [
  { key: "nombre", label: "Nombre del Producto", required: true, sampleValue: "Cera Modeladora" },
  { key: "descripcion", label: "Descripción", sampleValue: "Cera para peinado modeling" },
  { key: "categoria", label: "Categoría", sampleValue: "Wax" },
  { key: "imagen", label: "URL de Imagen", sampleValue: "https://ejemplo.com/imagen.jpg" },
];

const sampleProducts = [
  { nombre: "Cera Modeladora", descripcion: "Cera fuerte para peinado", categoria: "Wax", imagen: "" },
  { nombre: "Shampoo Volumen", descripcion: "Shampoo con volumen extra", categoria: "Shampoo & Conditioners", imagen: "" },
];

export function ImportProductsButton() {
  const [open, setOpen] = useState(false);

  const handleImport = async (data: ImportProductRow[]): Promise<ImportResult> => {
    const result = await importProducts(data);
    
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
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Productos desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o Excel con los datos de tus productos.
          </DialogDescription>
        </DialogHeader>
        <ImportExcelDialog
          config={{
            entityName: "Productos",
            columns: productColumns,
            sampleData: sampleProducts,
            onImport: handleImport,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
