"use client";

import { useState } from "react";
import { Package, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartImportWizard } from "@/components/shared/smart-import-wizard";
import type { ImportEntity, ColumnMapping, ImportResult } from "@/types/import-wizard";

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

export function ImportWizardPage() {
  const [selectedEntity, setSelectedEntity] = useState<ImportEntity | null>(null);

  const handleImport = async (
    data: Record<string, any>[],
    mappings: ColumnMapping[]
  ): Promise<ImportResult> => {
    const mappingMap = new Map(mappings.map(m => [m.sourceColumn, m.targetField]));
    
    const transformedData = data.map((row, idx) => {
      const transformed: Record<string, any> = {};
      
      for (const [sourceCol, targetField] of mappingMap) {
        if (sourceCol && targetField) {
          transformed[targetField] = row[sourceCol];
        }
      }
      
      return transformed;
    }).filter(row => Object.keys(row).length > 0);

    const errors: { row: number; field: string; message: string }[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < transformedData.length; i++) {
      const item = transformedData[i];
      
      if (!item.name && !item.sku) {
        errors.push({ row: i + 1, field: "name/sku", message: "Falta identificador del producto" });
        skipped++;
        continue;
      }

      imported++;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
    };
  };

  if (selectedEntity) {
    return (
      <div className="max-w-5xl mx-auto">
        <SmartImportWizard
          entity={selectedEntity}
          onImport={handleImport}
          onImportComplete={(result) => {
            console.log("Import completed:", result);
          }}
        />
      </div>
    );
  }

  return (
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
  );
}
