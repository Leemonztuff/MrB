"use server";

import { getSupabaseClientWithAuth, handleAction } from "./_helpers";
import { ActionResponse } from "@/types";

export async function uploadImage(
    file: File,
    bucket: string,
    folder: string = ""
): Promise<ActionResponse<string>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();

        const fileExt = file.name.split('.').pop();
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
