"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { FileData } from "@/types/import-wizard";

interface FileDropZoneProps {
  onFileLoaded: (data: FileData) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFileLoaded, onError, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const processFile = useCallback(async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      let data: Record<string, any>[] = [];

      if (extension === "csv") {
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
        
        if (parsed.errors.length > 0) {
          console.warn("CSV parse warnings:", parsed.errors);
        }
        
        data = parsed.data as Record<string, any>[];
      } else if (["xlsx", "xls"].includes(extension || "")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, any>[];
      } else {
        onError("Formato no soportado. Usa CSV o Excel (.xlsx, .xls)");
        return;
      }

      if (data.length === 0) {
        onError("El archivo está vacío");
        return;
      }

      const headers = Object.keys(data[0] || {});

      onFileLoaded({
        headers,
        rows: data,
        fileName: file.name,
      });
    } catch (error: any) {
      onError(`Error al procesar el archivo: ${error.message}`);
    }
  }, [onFileLoaded, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      processFile(file);
    }
  }, [disabled, processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      processFile(file);
    }
  }, [processFile]);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="import-file-upload"
            disabled={disabled}
          />
          <label htmlFor="import-file-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-muted">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">Arrastra o selecciona un archivo</p>
              <p className="text-sm text-muted-foreground mt-1">CSV o Excel (.xlsx, .xls)</p>
            </div>
          </label>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
