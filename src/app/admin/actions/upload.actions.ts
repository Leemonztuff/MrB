"use server";

import { getSupabaseClientWithAuth, handleAction } from "./_helpers";
import { ActionResponse } from "@/types";

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(
    file: File,
    bucket: string,
    folder: string = ""
): Promise<ActionResponse<string>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            throw new Error(`Tipo de archivo no permitido. Solo: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Archivo muy grande. Máximo 5MB`);
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !ALLOWED_IMAGE_TYPES.some(t => t.endsWith(fileExt))) {
            throw new Error("Extensión no permitida");
        }

        const fileName = `${crypto.randomUUID()}-${Date.now()}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error("Error al subir la imagen a Supabase.");
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    });
}