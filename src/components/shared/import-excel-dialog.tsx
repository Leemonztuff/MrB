"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export type ImportColumn = {
  key: string;
  label: string;
  required?: boolean;
  sampleValue?: string;
};

export type ImportPreview = {
  row: number;
  data: Record<string, any>;
  isValid: boolean;
  errors: string[];
};

export type ImportResult = {
  success: boolean;
  imported: number;
  errors: string[];
};

type ImportConfig = {
  entityName: string;
  columns: ImportColumn[];
  sampleData?: any[];
  onImport: (data: any[]) => Promise<ImportResult>;
};

export function ImportExcelDialog({ config }: { config: ImportConfig }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setResult(null);
    
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      
      let data: any[] = [];
      
      if (extension === "csv") {
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = parsed.data as any[];
      } else if (["xlsx", "xls"].includes(extension || "")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
      } else {
        throw new Error("Formato no soportado. Usa CSV o Excel (.xlsx, .xls)");
      }

      if (data.length === 0) {
        throw new Error("El archivo está vacío");
      }

      setParsedData(data);

      const previewData: ImportPreview[] = data.slice(0, 10).map((row, idx) => {
        const errors: string[] = [];
        
        config.columns.forEach(col => {
          if (col.required && !row[col.key] && row[col.key] !== 0) {
            errors.push(`Falta campo requerido: ${col.label}`);
          }
        });

        return {
          row: idx + 1,
          data: row,
          isValid: errors.length === 0,
          errors,
        };
      });

      setPreview(previewData);
    } catch (error: any) {
      setResult({
        success: false,
        imported: 0,
        errors: [error.message],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [config.columns]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const importResult = await config.onImport(parsedData);
      setResult(importResult);
      
      if (importResult.success) {
        setParsedData([]);
        setPreview([]);
        setFile(null);
      }
    } catch (error: any) {
      setResult({
        success: false,
        imported: 0,
        errors: [error.message],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setPreview([]);
    setResult(null);
  };

  const downloadTemplate = () => {
    const header = config.columns.map(c => c.key);
    const sample = config.sampleData && config.sampleData.length > 0 
      ? config.sampleData 
      : [config.columns.reduce((acc, col) => ({ ...acc, [col.key]: col.sampleValue || "" }), {})];
    
    const ws = XLSX.utils.json_to_sheet(sample, { header });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_${config.entityName.toLowerCase()}.csv`;
    link.click();
  };

  const validRows = preview.filter(p => p.isValid).length;
  const invalidRows = preview.filter(p => !p.isValid).length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar {config.entityName}
        </CardTitle>
        <CardDescription>
          Sube un archivo CSV o Excel (.xlsx, .xls) con los datos a importar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file && !result && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Arrastra o selecciona un archivo</p>
                <p className="text-sm text-muted-foreground">CSV o Excel (.xlsx, .xls)</p>
              </label>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Columnas requeridas:</p>
              <ul className="list-disc list-inside space-y-1">
                {config.columns.map(col => (
                  <li key={col.key}>
                    {col.label} {col.required && <span className="text-destructive">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Procesando archivo...</p>
          </div>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success ? "Importación exitosa" : "Error en importación"}
            </AlertTitle>
            <AlertDescription>
              {result.success ? (
                <span>{result.imported} registros importados correctamente</span>
              ) : (
                <ul className="list-disc list-inside mt-2">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && !result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-green-600 font-medium">{validRows} válidos</span>
                {" / "}
                <span className="text-destructive font-medium">{invalidRows} con errores</span>
                {" / "}
                <span>{parsedData.length} total</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    {config.columns.map(col => (
                      <th key={col.key} className="px-3 py-2 text-left font-medium">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.row} className={row.isValid ? "" : "bg-destructive/10"}>
                      <td className="px-3 py-2 text-muted-foreground">{row.row}</td>
                      {config.columns.map(col => (
                        <td key={col.key} className="px-3 py-2">
                          {row.data[col.key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedData.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando los primeros 10 de {parsedData.length} registros
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                onClick={handleImport} 
                disabled={isImporting || validRows === 0}
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Importar {validRows} registros
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
