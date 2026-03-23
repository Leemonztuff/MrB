"use client";

import { Check, AlertCircle, HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ColumnMapping, FieldDefinition } from "@/types/import-wizard";

interface MappingTableProps {
  mappings: ColumnMapping[];
  availableFields: FieldDefinition[];
  onMappingChange: (sourceColumn: string, targetField: string) => void;
  unmappedColumns: string[];
  onUnmappedSelect: (column: string, targetField: string) => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <Badge variant="default" className="bg-green-500/20 text-green-600 hover:bg-green-500/20">
        <Check className="h-3 w-3 mr-1" />
        Alto
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20">
        <HelpCircle className="h-3 w-3 mr-1" />
        Medio
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-muted/50">
      <AlertCircle className="h-3 w-3 mr-1" />
      Bajo
    </Badge>
  );
}

export function MappingTable({
  mappings,
  availableFields,
  onMappingChange,
  unmappedColumns,
  onUnmappedSelect,
}: MappingTableProps) {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Columna del archivo</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Campo destino</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Descripción</th>
              <th className="px-4 py-3 text-center text-sm font-medium">Confianza</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mappings.map((mapping) => (
              <tr key={mapping.sourceColumn} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {mapping.sourceColumn}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={mapping.targetField}
                    onChange={(e) => onMappingChange(mapping.sourceColumn, e.target.value)}
                    className="w-full max-w-[200px] h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Ignorar --</option>
                    {availableFields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                        {field.required && ' *'}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {mapping.description}
                </td>
                <td className="px-4 py-3 text-center">
                  <ConfidenceBadge confidence={mapping.confidence} />
                </td>
              </tr>
            ))}

            {unmappedColumns.map((column) => (
              <tr key={column} className="bg-muted/20 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {column}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value=""
                    onChange={(e) => onUnmappedSelect(column, e.target.value)}
                    className="w-full max-w-[200px] h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- No mapeada --</option>
                    {availableFields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                        {field.required && ' *'}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  Columna sin mapeo automático
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="outline" className="bg-gray-100">
                    --
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unmappedColumns.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {unmappedColumns.length} columna{unmappedColumns.length > 1 ? 's' : ''} sin mapear automáticamente.
          Puedes asignarlas manualmente usando los menús desplegables.
        </p>
      )}
    </div>
  );
}
