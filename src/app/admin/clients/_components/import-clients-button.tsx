"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { importClients, type ImportClientRow } from "@/app/admin/actions/clients.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImportExcelDialog, type ImportColumn, type ImportResult } from "@/components/shared/import-excel-dialog";

const clientColumns: ImportColumn[] = [
  { key: "nombre", label: "Nombre", required: true, sampleValue: "Juan Perez" },
  { key: "email", label: "Email", sampleValue: "juan@ejemplo.com" },
  { key: "telefono", label: "Telefono", sampleValue: "011-1234-5678" },
  { key: "celular", label: "Celular", sampleValue: "+54 9 11 1234-5678" },
  { key: "cuit", label: "CUIT", sampleValue: "20-12345678-9" },
  { key: "direccion", label: "Direccion", sampleValue: "Av. Corrientes 1234" },
  { key: "localidad", label: "Localidad", sampleValue: "Buenos Aires" },
  { key: "provincia", label: "Provincia", sampleValue: "CABA" },
  { key: "instagram", label: "Instagram", sampleValue: "@usuario" },
  { key: "contacto", label: "DNI Contacto", sampleValue: "12345678" },
];

const sampleClients = [
  { nombre: "Juan Perez", email: "juan@perez.com", telefono: "011-1234-5678", celular: "+54 9 11 6123-4567", cuit: "20-12345678-9", direccion: "Av. Corrientes 1234", localidad: "CABA", provincia: "CABA", instagram: "@jperez" },
  { nombre: "Maria Gonzalez", email: "maria@gonzalez.com", telefono: "011-2345-6789", celular: "+54 9 11 6234-5678", cuit: "27-23456789-0", direccion: "Calle Principal 456", localidad: "Palermo", provincia: "CABA", instagram: "@mgonzalez" },
];

export function ImportClientsButton() {
  const [open, setOpen] = useState(false);

  const handleImport = async (data: ImportClientRow[]): Promise<ImportResult> => {
    const result = await importClients(data);

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
      <DialogContent className="flex max-h-[min(90dvh,900px)] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Clientes desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o Excel con los datos de tus clientes. Los clientes se importaran con estado pendiente de convenio.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            <ImportExcelDialog
              config={{
                entityName: "Clientes",
                columns: clientColumns,
                sampleData: sampleClients,
                onImport: handleImport,
              }}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
