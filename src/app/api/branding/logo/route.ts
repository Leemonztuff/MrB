import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function extractStoredLogoPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value.trim();
  }

  try {
    const parsed = new URL(value);
    const publicMarker = "/storage/v1/object/public/app_assets/";
    const signMarker = "/storage/v1/object/sign/app_assets/";

    if (parsed.pathname.includes(publicMarker)) {
      return decodeURIComponent(parsed.pathname.split(publicMarker)[1] || "").trim() || null;
    }

    if (parsed.pathname.includes(signMarker)) {
      return decodeURIComponent(parsed.pathname.split(signMarker)[1] || "").trim() || null;
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["logo_path", "logo_url"]);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Logo not configured" }, { status: 404 });
  }

  const logoRow =
    data.find((row) => row.key === "logo_path") ||
    data.find((row) => row.key === "logo_url") ||
    null;

  const logoPath = extractStoredLogoPath(logoRow?.value);
  if (!logoPath) {
    return NextResponse.json({ error: "Logo path not found" }, { status: 404 });
  }

  const { data: file, error: downloadError } = await supabaseAdmin.storage
    .from("app_assets")
    .download(logoPath);

  if (downloadError || !file) {
    console.error("Branding logo download error:", downloadError?.message);
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }

  const arrayBuffer = await file.arrayBuffer();

  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
    },
  });
}
