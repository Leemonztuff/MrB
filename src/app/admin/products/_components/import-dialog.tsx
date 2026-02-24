
"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// SIMULATED Server Action - In a real app, this would process the Excel/CSV file.
async function importProductsFromFile(formData: FormData): Promise<{ error?: string, success?: string }> {
    const file = formData.get('import-file') as File;
    if (!file || file.size === 0) {
        return { error: "No se seleccionó ningún archivo." };
    }
    // Here you would use a library like 'xlsx' or 'papaparse' to parse the file
    // and then call a server action to bulk-insert the products.
    console.log("Simulating import for file:", file.name, "Type:", file.type);

    // Simulate a successful import for demonstration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real case, you would revalidate the path: revalidatePath('/admin/products');
    return { success: "Importación completada. 15 productos han sido agregados/actualizados." };
}


export function ImportProductsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [fileName, setFileName] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await importProductsFromFile(formData);
      if (result.error) {
        toast({ title: "Error en la importación", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: result.success });
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
            setFileName("");
        }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Upload className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Importar
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Productos desde Archivo</DialogTitle>
          <DialogDescription>
            Sube un archivo `.xlsx` o `.csv` para agregar o actualizar productos masivamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <Alert>
                <AlertTitle>Formato Esperado del Archivo</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">El archivo debe tener las siguientes columnas:</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                        <li><strong>name</strong> (Texto, requerido): Nombre del producto.</li>
                        <li><strong>description</strong> (Texto, opcional): Descripción.</li>
                        <li><strong>base_price</strong> (Número, requerido): Precio base sin IVA.</li>
                        <li><strong>category</strong> (Texto, opcional): Categoría para agrupar.</li>
                    </ul>
                </AlertDescription>
            </Alert>

            <div className="flex gap-4">
                <Button variant="link" asChild className="p-0 h-auto">
                    <a href="/plantilla-productos.xlsx" download>
                        Descargar plantilla Excel
                    </a>
                </Button>
                 <Button variant="link" asChild className="p-0 h-auto">
                    <a href="/plantilla-productos.csv" download>
                        Descargar plantilla CSV
                    </a>
                </Button>
            </div>
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="import-file">Archivo (.xlsx, .csv)</Label>
                <Input 
                    id="import-file" 
                    name="import-file"
                    type="file" 
                    accept=".xlsx,.csv"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} 
                    required
                />
            </div>
          
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending || !fileName}>
                {isPending ? "Importando..." : "Iniciar Importación"}
              </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
