"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, Check, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ColumnMapping } from "@/types/import-wizard";

interface DataPreviewTableProps {
  headers: string[];
  rows: Record<string, any>[];
  mappings: ColumnMapping[];
  maxRows?: number;
  className?: string;
}

export function DataPreviewTable({
  headers,
  rows,
  mappings,
  maxRows = 10,
  className,
}: DataPreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);
  
  const mappedHeaders = mappings.filter(m => m.targetField);
  const mappedSourceColumns = new Set(mappedHeaders.map(m => m.sourceColumn));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          Vista previa: {displayRows.length} de {rows.length} filas
        </span>
        <Badge variant="secondary" className="ml-auto">
          {mappedSourceColumns.size} columnas mapeadas
        </Badge>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-12">#</th>
              {mappedHeaders.map((mapping) => (
                <th key={mapping.sourceColumn} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs text-muted-foreground block">
                      {mapping.sourceColumn}
                    </span>
                    <span className="text-foreground">
                      {mapping.targetField}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayRows.map((row, idx) => {
              const hasEmptyValues = mappedHeaders.some(m => !row[m.sourceColumn] && row[m.sourceColumn] !== 0);
              
              return (
                <tr 
                  key={idx} 
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    hasEmptyValues && "bg-yellow-500/5"
                  )}
                >
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  {mappedHeaders.map((mapping) => {
                    const value = row[mapping.sourceColumn];
                    const isEmpty = !value && value !== 0;
                    
                    return (
                      <td 
                        key={mapping.sourceColumn} 
                        className={cn(
                          "px-3 py-2 max-w-[200px] truncate",
                          isEmpty && "text-muted-foreground italic"
                        )}
                        title={isEmpty ? "(vacío)" : String(value)}
                      >
                        {isEmpty ? "(vacío)" : String(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > maxRows && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando {maxRows} de {rows.length} registros
        </p>
      )}
    </div>
  );
}
