import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET_NAME = "hero-slider";
const TABLE_NAME = "hero_slider";

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

function json<T>(payload: ApiResponse<T>, status = 200) {
  return NextResponse.json(payload, { status });
}

function parseBoolean(value: FormDataEntryValue | null, fallback = true) {
  if (typeof value !== "string") return fallback;
  return value === "true" || value === "1" || value === "on";
}

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function sanitizeFileName(name: string) {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleanName || "hero-slider-image";
}

function extensionFromFile(file: File) {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : "";
  if (fromName) return fromName.toLowerCase();

  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  return "jpg";
}

function validateImageFile(file: File | null) {
  if (!file || file.size === 0) return null;

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are allowed.");
  }

  return file;
}

async function uploadHeroImage(file: File) {
  const extension = extensionFromFile(file);
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const storagePath = `homepage/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET_NAME)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
      cacheControl: "31536000",
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Image upload failed.");
  }

  const { data } = serviceClient.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) {
    throw new Error("Unable to create public URL for uploaded image.");
  }

  return { publicUrl, storagePath };
}

function getStoragePathFromPublicUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const index = imageUrl.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(imageUrl.slice(index + marker.length));
  }
}

async function removeStorageImage(imageUrl?: string | null) {
  const storagePath = getStoragePathFromPublicUrl(imageUrl);
  if (!storagePath) return;

  await serviceClient.storage.from(BUCKET_NAME).remove([storagePath]);
}

export async function GET() {
  try {
    const { data, error } = await serviceClient
      .from(TABLE_NAME)
      .select("id,title,image_url,sort_order,active,created_at")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      return json({ success: false, error: error.message }, 500);
    }

    return json({ success: true, data: data ?? [] });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const sortOrder = parseSortOrder(formData.get("sort_order"));
    const active = parseBoolean(formData.get("active"), true);
    const file = validateImageFile(formData.get("image") as File | null);

    if (!file) {
      return json({ success: false, error: "Image is required." }, 400);
    }

    const { publicUrl } = await uploadHeroImage(file);

    const { data, error } = await serviceClient
      .from(TABLE_NAME)
      .insert({
        title: title || null,
        image_url: publicUrl,
        sort_order: sortOrder,
        active,
      })
      .select("id,title,image_url,sort_order,active,created_at")
      .single();

    if (error) {
      await removeStorageImage(publicUrl);
      return json({ success: false, error: error.message }, 500);
    }

    return json({ success: true, data });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = Number(formData.get("id"));

    if (!Number.isFinite(id) || id <= 0) {
      return json({ success: false, error: "Valid slider id is required." }, 400);
    }

    const title = String(formData.get("title") ?? "").trim();
    const sortOrder = parseSortOrder(formData.get("sort_order"));
    const active = parseBoolean(formData.get("active"), true);
    const file = validateImageFile(formData.get("image") as File | null);

    const { data: existing, error: existingError } = await serviceClient
      .from(TABLE_NAME)
      .select("id,image_url")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return json({ success: false, error: existingError?.message || "Hero slider not found." }, 404);
    }

    let imageUrl = existing.image_url as string;
    let uploadedImageUrl: string | null = null;

    if (file) {
      const uploaded = await uploadHeroImage(file);
      uploadedImageUrl = uploaded.publicUrl;
      imageUrl = uploaded.publicUrl;
    }

    const { data, error } = await serviceClient
      .from(TABLE_NAME)
      .update({
        title: title || null,
        image_url: imageUrl,
        sort_order: sortOrder,
        active,
      })
      .eq("id", id)
      .select("id,title,image_url,sort_order,active,created_at")
      .single();

    if (error) {
      if (uploadedImageUrl) await removeStorageImage(uploadedImageUrl);
      return json({ success: false, error: error.message }, 500);
    }

    if (uploadedImageUrl && existing.image_url) {
      await removeStorageImage(existing.image_url);
    }

    return json({ success: true, data });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const idFromQuery = new URL(request.url).searchParams.get("id");
    const id = Number(body?.id ?? idFromQuery);

    if (!Number.isFinite(id) || id <= 0) {
      return json({ success: false, error: "Valid slider id is required." }, 400);
    }

    const { data: existing, error: existingError } = await serviceClient
      .from(TABLE_NAME)
      .select("id,image_url")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return json({ success: false, error: existingError?.message || "Hero slider not found." }, 404);
    }

    const { error } = await serviceClient.from(TABLE_NAME).delete().eq("id", id);

    if (error) {
      return json({ success: false, error: error.message }, 500);
    }

    await removeStorageImage(existing.image_url);

    return json({ success: true, data: { id } });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
}
