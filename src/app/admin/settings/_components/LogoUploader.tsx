"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { updateLogo, deleteLogo } from "@/app/admin/actions/settings.actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LOGO_PLACEHOLDER_PATH = "/branding/logo-placeholder.svg";

export function LogoUploader({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [persistedLogoUrl, setPersistedLogoUrl] = useState<string | null>(currentLogoUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("logo_image", selectedFile);

      const result = await updateLogo(formData);

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Exito", description: "Logo actualizado correctamente." });
      setPersistedLogoUrl((previous) => result.logoUrl ?? previous);
      setPreviewUrl(null);
      setSelectedFile(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteLogo();

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Exito", description: "Logo eliminado correctamente." });
      setPersistedLogoUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      router.refresh();
    });
  };

  const effectiveLogoUrl = previewUrl || persistedLogoUrl || LOGO_PLACEHOLDER_PATH;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo de la marca</CardTitle>
        <CardDescription>
          Gestiona el logo que se muestra en la aplicacion, pedidos y rotulos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo actual</Label>
          <div className="relative flex h-32 w-32 items-center justify-center rounded-md border bg-muted">
            <img
              src={effectiveLogoUrl}
              alt="Logo"
              className="h-full w-full object-contain p-2"
            />
          </div>
          {!persistedLogoUrl && !previewUrl ? (
            <p className="text-xs text-muted-foreground">Se está mostrando un logo placeholder temporal.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-upload">Subir nuevo logo</Label>
          <div className="flex items-center gap-2">
            <Input
              id="logo-upload"
              type="file"
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={handleFileChange}
              className="flex-grow"
              disabled={isPending}
            />
            <Button onClick={handleUpload} disabled={!selectedFile || isPending} size="icon">
              <Upload className="h-4 w-4" />
              <span className="sr-only">Subir</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Conviene usar PNG, JPG o WEBP. Si quieres verlo tambien en el PDF del rotulo, evita SVG.
          </p>
        </div>

        {currentLogoUrl && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">Eliminar el logo actual</p>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={isPending}>
              <X className="mr-2 h-4 w-4" />
              Eliminar logo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
