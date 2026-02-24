
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateLogo, deleteLogo } from "@/app/admin/actions/settings.actions";
import { Upload, X } from "lucide-react";

export function LogoUploader({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("logo_image", selectedFile);

      const result = await updateLogo(formData);

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Logo actualizado correctamente." });
        setPreviewUrl(null);
        setSelectedFile(null);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteLogo();
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Logo eliminado correctamente." });
      }
    });
  };

  const effectiveLogoUrl = previewUrl || currentLogoUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo de la Marca</CardTitle>
        <CardDescription>
          Gestiona el logo que se muestra en la aplicación y en los pedidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo Actual</Label>
          <div className="relative w-32 h-32 bg-muted rounded-md flex items-center justify-center border">
            {effectiveLogoUrl ? (
              <Image
                src={effectiveLogoUrl}
                alt="Logo"
                fill
                className="object-contain p-2"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Sin Logo</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-upload">Subir Nuevo Logo</Label>
          <div className="flex items-center gap-2">
            <Input
              id="logo-upload"
              type="file"
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={handleFileChange}
              className="flex-grow"
              disabled={isPending}
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isPending}
              size="icon"
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Subir</span>
            </Button>
          </div>
           <p className="text-xs text-muted-foreground">
            Se recomienda una imagen cuadrada (e.g., 256x256px).
          </p>
        </div>

        {currentLogoUrl && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">¿No necesitas un logo?</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Eliminar Logo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
