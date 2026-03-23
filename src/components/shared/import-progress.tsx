"use client";

import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ImportResult } from "@/types/import-wizard";

interface ImportProgressProps {
  status: 'idle' | 'importing' | 'completed' | 'error';
  progress: number;
  total: number;
  currentItem?: string;
  result?: ImportResult;
  onRetry?: () => void;
}

export function ImportProgress({
  status,
  progress,
  total,
  currentItem,
  result,
  onRetry,
}: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  if (status === 'completed' && result) {
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
          <div>
            <h3 className="font-semibold">Importación completada</h3>
            <p className="text-sm text-muted-foreground">
              {result.imported} registros importados exitosamente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-600">{result.imported}</p>
            <p className="text-xs text-muted-foreground">Importados</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
            <p className="text-xs text-muted-foreground">Omitidos</p>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
            <p className="text-xs text-muted-foreground">Errores</p>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-red-500/10 px-4 py-2 font-medium text-sm text-red-600">
              Errores encontrados
            </div>
            <div className="max-h-48 overflow-y-auto divide-y">
              {result.errors.slice(0, 20).map((error, idx) => (
                <div key={idx} className="px-4 py-2 text-sm">
                  <span className="text-muted-foreground">Fila {error.row}:</span>{' '}
                  <span className="font-medium">{error.field}</span>{' '}
                  <span className="text-muted-foreground">- {error.message}</span>
                </div>
              ))}
              {result.errors.length > 20 && (
                <div className="px-4 py-2 text-sm text-muted-foreground text-center">
                  ... y {result.errors.length - 20} errores más
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'error' && result) {
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-3 text-red-600">
          <XCircle className="h-8 w-8" />
          <div>
            <h3 className="font-semibold">Error en la importación</h3>
            <p className="text-sm text-muted-foreground">
              {result.errors.length} errores encontrados
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div>
          <h3 className="font-medium">Importando datos...</h3>
          {currentItem && (
            <p className="text-sm text-muted-foreground truncate max-w-md">
              {currentItem}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{progress} de {total}</span>
          <span>{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
