"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createNews, updateNews } from "@/app/admin/actions/news.actions";
import type { NewsPost } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { RichEditor } from "./rich-editor";
import { ImageUpload } from "@/components/shared/image-upload";

export const newsSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  image_url: z.string().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
});

export type NewsFormValues = z.infer<typeof newsSchema>;

interface NewsFormProps {
  news?: NewsPost;
  onClose?: () => void;
}

export function NewsForm({ news, onClose }: NewsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    news?.starts_at ? new Date(news.starts_at) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    news?.ends_at ? new Date(news.ends_at) : undefined
  );
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: news?.title || "",
      content: news?.content || "",
      image_url: news?.image_url || "",
      is_active: news?.is_active ?? true,
      display_order: news?.display_order || 0,
      starts_at: news?.starts_at || "",
      ends_at: news?.ends_at || "",
    },
  });

  const isActive = watch("is_active");

  const onSubmit = async (data: NewsFormValues) => {
    setIsPending(true);
    try {
      const payload = {
        ...data,
        starts_at: startDate ? startDate.toISOString() : undefined,
        ends_at: endDate ? endDate.toISOString() : undefined,
      };

      const result = news
        ? await updateNews(news.id, payload)
        : await createNews(payload);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: news ? "Noticia actualizada correctamente." : "Noticia creada correctamente.",
        });
        router.refresh();
        onClose?.();
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Título de la noticia"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenido</Label>
        <RichEditor
          value={watch("content")}
          onChange={(val) => setValue("content", val, { shouldDirty: true, shouldValidate: true })}
          placeholder="Escribe el contenido aquí... Usa @ para mencionar productos."
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <ImageUpload
          value={watch("image_url")}
          onChange={(url: string) => setValue("image_url", url, { shouldDirty: true })}
          bucket="product_images" // Reuse existing bucket or create separate one
          folder="news"
          label="Imagen de la Noticia"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha de inicio</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate
                  ? format(startDate, "PPP", { locale: es })
                  : "Sin fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Fecha de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate
                  ? format(endDate, "PPP", { locale: es })
                  : "Sin fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">Orden de visualización</Label>
        <Input
          id="display_order"
          type="number"
          {...register("display_order", { valueAsNumber: true })}
          min={0}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="is_active">Publicar</Label>
          <p className="text-xs text-muted-foreground">
            Visible en el portal del cliente
          </p>
        </div>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked: boolean) => setValue("is_active", checked)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Guardando..." : news ? "Actualizar noticia" : "Crear noticia"}
      </Button>
    </form>
  );
}
