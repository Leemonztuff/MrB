"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { listStorageImages, type StorageImage } from "@/app/admin/actions/storage.actions";
import { Images, Loader2, RefreshCw, ImageOff } from "lucide-react";

export function StorageImagePicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await listStorageImages();

    if (result.error) {
      setError(result.error.message);
      setImages([]);
    } else {
      setImages(result.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return images;
    return images.filter((image) => image.path.toLowerCase().includes(q));
  }, [images, query]);

  const handleSelect = (url: string) => {
    onSelect(url);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="shrink-0 gap-2">
          <Images className="h-4 w-4" />
          Elegir del bucket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Explorar imágenes</DialogTitle>
          <DialogDescription>
            Elegí una imagen ya subida para asignarla al producto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre o carpeta..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={load}
            disabled={loading}
            title="Actualizar"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>

        {error ? (
          <div className="p-10 text-center text-sm text-destructive">{error}</div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando imágenes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <p className="text-sm">
              {images.length === 0 ? "No hay imágenes en el bucket." : "No hay resultados para la búsqueda."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[55vh]">
            <div className="grid grid-cols-2 gap-3 pr-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((image) => (
                <button
                  key={`${image.bucket}/${image.path}`}
                  type="button"
                  onClick={() => handleSelect(image.url)}
                  className="group overflow-hidden rounded-lg border border-white/10 bg-white/5 text-left transition-colors hover:border-primary/60"
                >
                  <div className="relative aspect-square bg-white/5">
                    <Image
                      src={image.url}
                      alt={image.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="200px"
                    />
                  </div>
                  <div className="space-y-1 p-2">
                    <p className="truncate text-[10px] font-medium" title={image.path}>
                      {image.name}
                    </p>
                    <Badge variant="secondary" className="text-[8px] uppercase tracking-wide">
                      {image.bucket}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
