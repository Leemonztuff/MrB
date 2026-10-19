"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updateLabelLogo, deleteLabelLogo } from "@/app/admin/actions/settings.actions";
import { Upload, X, ImageIcon } from "lucide-react";

export function LabelLogoUploader({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetSelection();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("label_logo_image", selectedFile);

      const result = await updateLabelLogo(formData);

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Logo de rótulos actualizado correctamente." });
        handleOpenChange(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteLabelLogo();

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Logo de rótulos eliminado correctamente." });
        handleOpenChange(false);
        router.refresh();
      }
    });
  };

  const effectiveLogoUrl = previewUrl || currentLogoUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo de Rótulos</CardTitle>
        <CardDescription>
          Logo horizontal que se imprime en los rótulos de envío. Formato recomendado: 912 × 168 px.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo Actual</Label>
          <div className="relative aspect-[912/168] w-full max-w-sm overflow-hidden rounded-md border border-white/10 bg-white/5 flex items-center justify-center">
            {effectiveLogoUrl ? (
              <Image
                src={effectiveLogoUrl}
                alt="Logo de rótulos"
                fill
                className="object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
                <span className="text-xs">Sin logo</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Es independiente del icono cuadrado que se usa en la app.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Configurar logo de rótulos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Logo de Rótulos</DialogTitle>
              <DialogDescription>
                Subí el logo horizontal (912 × 168 px) que aparecerá impreso en los rótulos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative aspect-[912/168] w-full overflow-hidden rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                {effectiveLogoUrl ? (
                  <Image
                    src={effectiveLogoUrl}
                    alt="Vista previa del logo de rótulos"
                    fill
                    className="object-contain p-3"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Sin logo</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-logo-upload">Subir Nuevo Logo</Label>
                <Input
                  ref={inputRef}
                  id="label-logo-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleFileChange}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: 912 × 168 px, PNG o SVG con fondo transparente. Tamaño máximo 5 MB.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {currentLogoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Eliminar logo
                  </Button>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={!selectedFile || isPending}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isPending ? "Guardando..." : "Subir logo"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
