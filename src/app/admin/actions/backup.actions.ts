"use server";

import JSZip from "jszip";
import { getSupabaseClientWithAuth } from "./_helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TABLES_IN_ORDER = [
  "products",
  "price_lists",
  "promotions",
  "sales_conditions",
  "price_list_items",
  "agreements",
  "agreement_promotions",
  "agreement_sales_conditions",
  "clients",
  "app_settings",
  "orders",
  "order_items",
] as const;

type TableBackupData = Record<string, unknown>[];

export interface BackupExport {
  metadata: {
    version: "1.0";
    exportedAt: string;
    tableCounts: Record<string, number>;
  };
  data: Record<string, TableBackupData>;
}

export async function exportBackup(
  tables?: string[]
): Promise<{ data: string; filename: string }> {
  const supabase = await getSupabaseClientWithAuth();
  const tablesToExport = tables?.length
    ? TABLES_IN_ORDER.filter((t) => tables.includes(t))
    : [...TABLES_IN_ORDER];

  const data: Record<string, TableBackupData> = {};
  const tableCounts: Record<string, number> = {};

  for (const table of tablesToExport) {
    const { data: rows, error } = await supabase
      .from(table)
      .select("*");

    if (error) {
      throw new Error(`Error al exportar la tabla '${table}': ${error.message}`);
    }

    data[table] = rows || [];
    tableCounts[table] = (rows || []).length;
  }

  const backup: BackupExport = {
    metadata: {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      tableCounts,
    },
    data,
  };

  const json = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `backup-mrb-${date}.json`;

  return { data: json, filename };
}

export async function importBackup(
  backupData: BackupExport
): Promise<Record<string, number>> {
  const supabase = await getSupabaseClientWithAuth();
  const counts: Record<string, number> = {};

  const tablesToImport = [...TABLES_IN_ORDER].reverse();

  for (const table of tablesToImport) {
    const rows = backupData.data[table];
    if (!rows || rows.length === 0) {
      counts[table] = 0;
      continue;
    }

    const { error } = await supabase.from(table).upsert(rows, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Error al importar la tabla '${table}': ${error.message}`);
    }

    counts[table] = rows.length;
  }

  return counts;
}

const STORAGE_BUCKETS = ["app_assets", "product_images"] as const;

export async function exportImages(): Promise<{
  data: string;
  filename: string;
}> {
  const admin = supabaseAdmin;
  if (!admin) throw new Error("Supabase admin client no disponible.");

  const zip = new JSZip();

  for (const bucket of STORAGE_BUCKETS) {
    const { data: files, error: listError } = await admin.storage
      .from(bucket)
      .list("");

    if (listError) {
      console.error(`Error listando bucket '${bucket}':`, listError.message);
      continue;
    }

    if (!files) continue;

    for (const file of files) {
      if (file.id === null) continue;

      const { data: fileData, error: downloadError } = await admin.storage
        .from(bucket)
        .download(file.name);

      if (downloadError || !fileData) {
        console.error(
          `Error descargando '${bucket}/${file.name}':`,
          downloadError?.message
        );
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      zip.file(`${bucket}/${file.name}`, arrayBuffer);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const base64 = zipBuffer.toString("base64");
  const date = new Date().toISOString().slice(0, 10);
  const filename = `backup-mrb-imagenes-${date}.zip`;

  return { data: base64, filename };
}

export async function importImages(
  zipBase64: string
): Promise<{ uploaded: number; errors: string[] }> {
  const admin = supabaseAdmin;
  if (!admin) throw new Error("Supabase admin client no disponible.");

  const zipBuffer = Buffer.from(zipBase64, "base64");
  const zip = await JSZip.loadAsync(zipBuffer);

  let uploaded = 0;
  const errors: string[] = [];

  const entries = Object.entries(zip.files);

  for (const [path, zipEntry] of entries) {
    if (zipEntry.dir) continue;

    const slashIndex = path.indexOf("/");
    if (slashIndex === -1) {
      errors.push(`Ruta invalida en ZIP: '${path}'`);
      continue;
    }

    const bucket = path.substring(0, slashIndex);
    const filePath = path.substring(slashIndex + 1);

    if (!STORAGE_BUCKETS.includes(bucket as (typeof STORAGE_BUCKETS)[number])) {
      errors.push(`Bucket no reconocido: '${bucket}' en '${path}'`);
      continue;
    }

    const arrayBuffer = await zipEntry.async("arraybuffer");
    const { error } = await admin.storage
      .from(bucket)
      .upload(filePath, Buffer.from(arrayBuffer), {
        contentType: getContentType(filePath),
        upsert: true,
      });

    if (error) {
      errors.push(`Error subiendo '${path}': ${error.message}`);
    } else {
      uploaded++;
    }
  }

  return { uploaded, errors };
}

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
