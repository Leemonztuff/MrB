"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, Loader2, UploadCloud } from "lucide-react";
import { uploadImage } from "@/app/admin/actions/upload.actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    bucket?: string;
    folder?: string;
    label?: string;
}

export function ImageUpload({
    value,
    onChange,
    bucket = "product_images",
    folder = "news",
    label = "Imagen"
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Archivo demasiado grande",
                description: "El tamaño máximo permitido es 5MB.",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadImage(file, bucket, folder);
            if (result.success && result.data) {
                onChange(result.data);
                toast({
                    title: "Éxito",
                    description: "Imagen subida correctamente."
                });
            } else {
                throw new Error(result.error?.message || "Error desconocido");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo subir la imagen.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemove = () => {
        onChange("");
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Remover
                    </Button>
                )}
            </div>

            <div className="relative group">
                {value ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/50">
                        <Image
                            src={value}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-colors cursor-pointer group"
                    >
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        ) : (
                            <>
                                <div className="p-3 rounded-full bg-primary/10 mb-3">
                                    <UploadCloud className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-foreground">Click para subir imagen</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">PNG, JPG hasta 5MB</p>
                            </>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                />
            </div>
        </div>
    );
}
