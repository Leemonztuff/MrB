"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, Upload, Table2, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileDropZone } from "./file-drop-zone";
import { AIAnalysisLoader } from "./ai-analysis-loader";
import { MappingTable } from "./mapping-table";
import { DataPreviewTable } from "./data-preview-table";
import { ImportProgress } from "./import-progress";
import { analyzeImportColumns } from "@/ai/flows/analyze-import-columns-flow";
import type {
  ImportEntity,
  FileData,
  ImportAnalysisResult,
  ColumnMapping,
  ImportResult,
  FieldDefinition,
} from "@/types/import-wizard";

const STEPS = [
  { id: 1, title: "Subir archivo", icon: Upload },
  { id: 2, title: "Análisis IA", icon: Sparkles },
  { id: 3, title: "Revisar mapeo", icon: Settings },
  { id: 4, title: "Importar", icon: Table2 },
];

const FIELD_MAP: Record<ImportEntity, FieldDefinition[]> = {
  productos: [
    { key: "sku", label: "SKU", type: "string", description: "Código único del producto" },
    { key: "name", label: "Nombre", type: "string", required: true, description: "Nombre del producto" },
    { key: "description", label: "Descripción", type: "string", description: "Descripción detallada" },
    { key: "category", label: "Categoría", type: "string", description: "Categoría: Cabello, Rostro, Merchandising" },
    { key: "price", label: "Precio", type: "number", description: "Precio unitario" },
    { key: "volume_price", label: "Precio Volumen", type: "number", description: "Precio por mayor" },
    { key: "stock", label: "Stock", type: "number", description: "Cantidad en inventario" },
    { key: "image_url", label: "URL Imagen", type: "string", description: "URL de la imagen" },
  ] as FieldDefinition[],
  clientes: [
    { key: "contact_name", label: "Nombre", type: "string", required: true, description: "Nombre del contacto" },
    { key: "email", label: "Email", type: "string", description: "Correo electrónico" },
    { key: "phone", label: "Teléfono", type: "string", description: "Teléfono/WhatsApp" },
    { key: "address", label: "Dirección", type: "string", description: "Dirección" },
    { key: "cuit", label: "CUIT/DNI", type: "string", description: "Documento fiscal" },
    { key: "instagram", label: "Instagram", type: "string", description: "Usuario de Instagram" },
    { key: "delivery_window", label: "Horario Entrega", type: "string", description: "Ventana horaria" },
  ] as FieldDefinition[],
  listas_precios: [
    { key: "sku", label: "SKU", type: "string", required: true, description: "Código del producto" },
    { key: "name", label: "Nombre", type: "string", description: "Nombre del producto" },
    { key: "price", label: "Precio", type: "number", required: true, description: "Precio en lista" },
    { key: "volume_price", label: "Precio Volumen", type: "number", description: "Precio por mayor" },
  ] as FieldDefinition[],
};

interface SmartImportWizardProps {
  entity: ImportEntity;
  onImportComplete?: (result: ImportResult) => void;
  onImport: (data: Record<string, any>[], mappings: ColumnMapping[]) => Promise<ImportResult>;
}

export function SmartImportWizard({ entity, onImportComplete, onImport }: SmartImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImportAnalysisResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileLoaded = useCallback(async (data: FileData) => {
    setFileData(data);
    setAnalysisError(null);
    setIsAnalyzing(true);
    setCurrentStep(2);

    try {
      const sampleRows = data.rows.slice(0, 10);
      const result = await analyzeImportColumns({
        headers: data.headers,
        sampleRows,
        targetEntity: entity,
      });

      setAnalysisResult(result);
      setMappings(result.columnMappings);
      setUnmappedColumns(result.unmappedColumns);
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Analysis error:", error);
      setAnalysisError(error.message || "Error al analizar el archivo");
    } finally {
      setIsAnalyzing(false);
    }
  }, [entity]);

  const handleMappingChange = useCallback((sourceColumn: string, targetField: string) => {
    if (!targetField) {
      setMappings(prev => prev.filter(m => m.sourceColumn !== sourceColumn));
      setUnmappedColumns(prev => [...prev, sourceColumn]);
    } else {
      setMappings(prev => {
        const existing = prev.find(m => m.sourceColumn === sourceColumn);
        if (existing) {
          return prev.map(m => m.sourceColumn === sourceColumn ? { ...m, targetField } : m);
        }
        return [...prev, { sourceColumn, targetField, confidence: 1, description: "" }];
      });
      setUnmappedColumns(prev => prev.filter(c => c !== sourceColumn));
    }
  }, []);

  const handleUnmappedSelect = useCallback((column: string, targetField: string) => {
    if (targetField) {
      setMappings(prev => [...prev, { sourceColumn: column, targetField, confidence: 1, description: "" }]);
      setUnmappedColumns(prev => prev.filter(c => c !== column));
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!fileData) return;

    setIsImporting(true);
    setImportResult(null);
    setCurrentStep(4);

    try {
      const result = await onImport(fileData.rows, mappings);
      setImportResult(result);
      onImportComplete?.(result);
    } catch (error: any) {
      setImportResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, field: "general", message: error.message }],
        skipped: 0,
      });
    } finally {
      setIsImporting(false);
    }
  }, [fileData, mappings, onImport, onImportComplete]);

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setFileData(null);
    setAnalysisResult(null);
    setMappings([]);
    setUnmappedColumns([]);
    setAnalysisError(null);
    setIsImporting(false);
    setImportResult(null);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const canProceedToImport = mappings.some(m => m.targetField);

  const availableFields = FIELD_MAP[entity];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Nuevo archivo
        </Button>

        {fileData && (
          <p className="text-sm text-muted-foreground">
            {fileData.fileName} - {fileData.rows.length} filas
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 py-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isActive && "border-primary text-primary bg-primary/10",
                    !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium hidden sm:block",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-2",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Paso 1: Subir archivo"}
            {currentStep === 2 && "Paso 2: Analizando con IA..."}
            {currentStep === 3 && "Paso 3: Revisar mapeo de columnas"}
            {currentStep === 4 && "Paso 4: Importar datos"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Sube un archivo CSV o Excel con los datos a importar"}
            {currentStep === 2 && "Nuestro asistente de IA está analizando tu archivo"}
            {currentStep === 3 && "Verifica y ajusta el mapeo de columnas según sea necesario"}
            {currentStep === 4 && "Revisa los resultados de la importación"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <FileDropZone
              onFileLoaded={handleFileLoaded}
              onError={setAnalysisError}
              disabled={isAnalyzing}
            />
          )}

          {currentStep === 2 && (
            <AIAnalysisLoader
              status="analyzing"
              fileName={fileData?.fileName}
            />
          )}

          {currentStep === 3 && analysisResult && (
            <div className="space-y-6">
              {analysisResult.suggestions.length > 0 && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {analysisError && (
                <Alert variant="destructive">
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-2xl font-bold">{analysisResult.dataQuality.totalRows}</p>
                  <p className="text-xs text-muted-foreground">Total filas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{analysisResult.dataQuality.emptyRows}</p>
                  <p className="text-xs text-muted-foreground">Filas vacías</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{analysisResult.dataQuality.duplicateRows}</p>
                  <p className="text-xs text-muted-foreground">Duplicados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{mappings.filter(m => m.targetField).length}</p>
                  <p className="text-xs text-muted-foreground">Columnas mapeadas</p>
                </div>
              </div>

              <Tabs defaultValue="mapping" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mapping">Mapeo de columnas</TabsTrigger>
                  <TabsTrigger value="preview">Vista previa</TabsTrigger>
                </TabsList>
                <TabsContent value="mapping" className="mt-4">
                  <MappingTable
                    mappings={mappings}
                    availableFields={availableFields}
                    onMappingChange={handleMappingChange}
                    unmappedColumns={unmappedColumns}
                    onUnmappedSelect={handleUnmappedSelect}
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  {fileData && (
                    <DataPreviewTable
                      headers={fileData.headers}
                      rows={fileData.rows}
                      mappings={mappings.filter(m => m.targetField)}
                    />
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!canProceedToImport}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {fileData?.rows.length || 0} registros
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <ImportProgress
              status={importResult ? (importResult.success ? 'completed' : 'error') : 'importing'}
              progress={importResult?.imported || 0}
              total={fileData?.rows.length || 0}
              result={importResult || undefined}
              onRetry={handleBack}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
