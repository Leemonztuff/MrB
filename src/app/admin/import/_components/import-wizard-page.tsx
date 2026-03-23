"use client";

import { useState } from "react";
import { Package, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartImportWizard } from "@/components/shared/smart-import-wizard";
import type { ImportEntity, ColumnMapping, ImportResult } from "@/types/import-wizard";
import { importProducts } from "@/app/admin/actions/products.actions";
import { importClientsWithMapping } from "@/app/admin/actions/clients.actions";
import { toast } from "sonner";

type ImportCategory = {
  id: ImportEntity;
  label: string;
  icon: React.ElementType;
  description: string;
};

const IMPORT_CATEGORIES: ImportCategory[] = [
  {
    id: "productos",
    label: "Productos",
    icon: Package,
    description: "Importar productos al catálogo con nombre, precio, categoría, etc.",
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    description: "Importar clientes con datos de contacto y dirección.",
  },
  {
    id: "listas_precios",
    label: "Listas de Precios",
    icon: DollarSign,
    description: "Importar precios para crear o actualizar listas de precios.",
  },
];

const ENTITY_LABELS: Record<ImportEntity, string> = {
  productos: "productos",
  clientes: "clientes",
  listas_precios: "listas de precios",
};

export function ImportWizardPage() {
  const [selectedEntity, setSelectedEntity] = useState<ImportEntity | null>(null);

  const handleImport = async (
    data: Record<string, any>[],
    mappings: ColumnMapping[]
  ): Promise<ImportResult> => {
    const validMappings = mappings.filter(m => m.targetField);

    if (validMappings.length === 0) {
      return {
        success: false,
        imported: 0,
        skipped: data.length,
        errors: [{ row: 0, field: "general", message: "Debes mapear al menos una columna antes de importar" }],
      };
    }

    try {
      if (selectedEntity === "productos") {
        const result = await importProducts(data, validMappings);

        if (result.error) {
          return {
            success: false,
            imported: 0,
            skipped: data.length,
            errors: [{ row: 0, field: "general", message: result.error.message }],
          };
        }

        return {
          success: true,
          imported: result.data?.imported || 0,
          skipped: result.data?.updated || 0,
          errors: (result.data?.errors || []).map(e => ({
            row: e.row,
            field: "",
            message: e.message
          })),
        };
      }

      if (selectedEntity === "clientes") {
        const result = await importClientsWithMapping(data, validMappings);

        if (result.error) {
          return {
            success: false,
            imported: 0,
            skipped: data.length,
            errors: [{ row: 0, field: "general", message: result.error.message }],
          };
        }

        return {
          success: true,
          imported: result.data?.imported || 0,
          skipped: 0,
          errors: (result.data?.errors || []).map(e => ({
            row: e.row,
            field: "",
            message: e.message
          })),
        };
      }

      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, field: "general", message: `Importación de ${selectedEntity} aún no implementada` }],
      };
    } catch (error: any) {
      return {
        success: false,
        imported: 0,
        skipped: data.length,
        errors: [{ row: 0, field: "general", message: error.message || "Error desconocido" }],
      };
    }
  };

  if (selectedEntity) {
    return (
      <div className="max-w-5xl mx-auto">
        <SmartImportWizard
          entity={selectedEntity}
          onImport={handleImport}
          onImportComplete={(result) => {
            const entityLabel = ENTITY_LABELS[selectedEntity];
            if (result.success) {
              toast.success(`Importación exitosa: ${result.imported} ${entityLabel} importados`);
            } else if (result.imported > 0) {
              toast.warning(`Importación parcial: ${result.imported} ${entityLabel}, ${result.errors.length} errores`);
            } else {
              toast.error("Error en la importación");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Selecciona el tipo de datos</h2>
        <p className="text-sm text-muted-foreground">
          Elige qué tipo de información quieres importar desde tu archivo Excel o CSV.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        {IMPORT_CATEGORIES.map((category) => {
          const Icon = category.icon;
          
          return (
            <Card
              key={category.id}
              className="cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
              onClick={() => setSelectedEntity(category.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{category.label}</CardTitle>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Haz clic para comenzar a importar {category.label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
