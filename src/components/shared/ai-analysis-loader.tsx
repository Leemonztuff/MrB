"use client";

import { Sparkles, Brain, FileSearch, BarChart3 } from "lucide-react";

interface AIAnalysisLoaderProps {
  status: 'analyzing' | 'mapping' | 'validating';
  fileName?: string;
}

const STATUS_CONFIG = {
  analyzing: {
    icon: FileSearch,
    title: 'Analizando archivo',
    description: 'Extrayendo encabezados y datos de muestra...',
  },
  mapping: {
    icon: Brain,
    title: 'Mapeando columnas',
    description: 'La IA está identificando y mapeando las columnas...',
  },
  validating: {
    icon: BarChart3,
    title: 'Validando datos',
    description: 'Verificando calidad y detectando posibles errores...',
  },
};

export function AIAnalysisLoader({ status, fileName }: AIAnalysisLoaderProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative p-6 rounded-full bg-primary/10">
          <Icon className="h-12 w-12 text-primary animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold">{config.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        {fileName && (
          <p className="text-xs text-muted-foreground mt-1">
            Archivo: {fileName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
