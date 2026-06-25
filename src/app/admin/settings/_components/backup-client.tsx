"use client";

import { useState, useRef, useCallback } from "react";
import {
  Download,
  Upload,
  Database,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  exportBackup,
  importBackup,
  exportImages,
  importImages,
  type BackupExport,
} from "@/app/admin/actions/backup.actions";

const TABLE_LABELS: Record<string, string> = {
  products: "Productos",
  price_lists: "Listas de Precios",
  promotions: "Promociones",
  sales_conditions: "Condiciones de Venta",
  price_list_items: "Precios por Producto",
  agreements: "Convenios",
  agreement_promotions: "Convenio-Promociones",
  agreement_sales_conditions: "Convenio-Condiciones",
  clients: "Clientes",
  app_settings: "Configuracion",
  orders: "Pedidos",
  order_items: "Items de Pedidos",
};

const DEFAULT_TABLES = Object.keys(TABLE_LABELS).filter(
  (t) => !t.startsWith("order")
);

export function BackupClient() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [selectedTables, setSelectedTables] = useState<string[]>(DEFAULT_TABLES);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingImages, setIsImportingImages] = useState(false);
  const [importResult, setImportResult] = useState<Record<string, number> | null>(null);

  const toggleTable = (table: string) => {
    setSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  const toggleAll = () => {
    setSelectedTables((prev) =>
      prev.length === Object.keys(TABLE_LABELS).length
        ? DEFAULT_TABLES
        : Object.keys(TABLE_LABELS)
    );
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await exportBackup(selectedTables);
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      const counts = JSON.parse(result.data).metadata.tableCounts;
      const total = Object.values(counts).reduce((a, b) => (a as number) + (b as number), 0) as number;
      toast({
        title: "Datos exportados",
        description: `${total} registros en ${Object.keys(counts).length} tablas.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImages = async () => {
    setIsExportingImages(true);
    try {
      const result = await exportImages();
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Imagenes exportadas",
        description: "Archivo ZIP descargado correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al exportar imagenes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExportingImages(false);
    }
  };

  const handleImportData = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setImportResult(null);
      try {
        const text = await file.text();
        const backupData: BackupExport = JSON.parse(text);

        if (!backupData.metadata || !backupData.data) {
          throw new Error("Archivo de backup invalido.");
        }

        const counts = await importBackup(backupData);
        setImportResult(counts);

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        toast({
          title: "Datos importados",
          description: `${total} registros restaurados correctamente.`,
        });
      } catch (error: any) {
        toast({
          title: "Error al importar",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    },
    [toast]
  );

  const handleImportImages = useCallback(
    async (file: File) => {
      setIsImportingImages(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        const result = await importImages(base64);

        if (result.errors.length > 0) {
          toast({
            title: "Imagenes importadas con errores",
            description: `${result.uploaded} subidas, ${result.errors.length} errores.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Imagenes importadas",
            description: `${result.uploaded} archivos subidos correctamente.`,
          });
        }
      } catch (error: any) {
        toast({
          title: "Error al importar imagenes",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsImportingImages(false);
      }
    },
    [toast]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImportData(file);
        e.target.value = "";
      }
    },
    [handleImportData]
  );

  const handleZipChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImportImages(file);
        e.target.value = "";
      }
    },
    [handleImportImages]
  );

  const anyLoading = isExporting || isExportingImages || isImporting || isImportingImages;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exportar
          </CardTitle>
          <CardDescription>Descarga la configuracion actual de la app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tablas a exportar:</span>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="h-7 text-xs">
                {selectedTables.length === Object.keys(TABLE_LABELS).length
                  ? "Deseleccionar pedidos"
                  : "Seleccionar todo"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TABLE_LABELS).map(([table, label]) => (
                <label
                  key={table}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTables.includes(table)}
                    onCheckedChange={() => toggleTable(table)}
                  />
                  <span className={selectedTables.includes(table) ? "" : "text-muted-foreground"}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleExportData}
              disabled={anyLoading || selectedTables.length === 0}
              className="flex-1"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Exportar Datos
            </Button>
            <Button
              onClick={handleExportImages}
              disabled={anyLoading}
              variant="outline"
              className="flex-1"
            >
              {isExportingImages ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              Exportar Imagenes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Restaurar
          </CardTitle>
          <CardDescription>Importa un backup previo de la app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleZipChange}
          />

          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={anyLoading}
              className="flex-1"
              variant="outline"
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Importar Datos (.json)
            </Button>
            <Button
              onClick={() => zipInputRef.current?.click()}
              disabled={anyLoading}
              className="flex-1"
              variant="outline"
            >
              {isImportingImages ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              Importar Imagenes (.zip)
            </Button>
          </div>

          {importResult && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Importacion completada
              </p>
              {Object.entries(importResult)
                .filter(([, count]) => count > 0)
                .map(([table, count]) => (
                  <p key={table} className="text-xs text-muted-foreground pl-6">
                    {TABLE_LABELS[table] || table}: {count} registros
                  </p>
                ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/50 border border-white/5">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                La restauracion sobrescribe los datos existentes por tabla.
                Se recomienda exportar un backup actual antes de importar.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
