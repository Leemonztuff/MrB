"use client";

import { useState } from "react";
import { Database, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  migrateProductImagesToAppAssets,
  type ImageMigrationResult,
} from "@/app/admin/actions/storage.actions";

export function StorageMaintenance() {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<ImageMigrationResult | null>(null);
  const { toast } = useToast();

  const handleMigrate = async () => {
    setIsPending(true);
    setResult(null);

    try {
      const response = await migrateProductImagesToAppAssets();

      if (response.error) throw new Error(response.error.message);

      const data = response.data ?? { copied: 0, updatedProducts: 0, skipped: 0, errors: [] };
      setResult(data);

      toast({
        title: "Migración completada",
        description: `${data.copied} archivo(s) copiados, ${data.updatedProducts} producto(s) actualizados.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al migrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Migrar imágenes al bucket unificado
        </CardTitle>
        <CardDescription>
          Copia las imágenes de <code>product_images</code> a <code>app_assets</code> (el bucket de
          los logos) y actualiza la URL de cada producto. No borra los archivos originales.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleMigrate} disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isPending ? "Migrando..." : "Migrar imágenes"}
        </Button>

        {result && (
          <div className="space-y-1 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Migración completada
            </p>
            <p className="pl-6 text-xs text-muted-foreground">
              {result.copied} archivo(s) copiados · {result.updatedProducts} producto(s)
              actualizados · {result.skipped} sin migrar
            </p>
            {result.errors.length > 0 && (
              <div className="space-y-0.5 pl-6 text-xs text-destructive">
                {result.errors.slice(0, 5).map((message) => (
                  <p key={message}>{message}</p>
                ))}
                {result.errors.length > 5 && (
                  <p>... y {result.errors.length - 5} error(es) más</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-muted/50 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Es seguro ejecutarlo más de una vez: usa <code>upsert</code> y solo actualiza los
            productos que todavía apuntan a <code>product_images</code>.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
