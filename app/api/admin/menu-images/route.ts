// app/api/admin/menu-images/route.ts

import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "menu_item_image";
const MAX_FILE_SIZE = 50 * 1024;

function sanitizePhotoName(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.webp$/i, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeForSearch(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.webp$/i, "")
    .replace(/[_\s-]+/g, "");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function listAllFiles() {
  const allFiles: any[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await serviceClient.storage
      .from(BUCKET_NAME)
      .list("", {
        limit: pageSize,
        offset,
        sortBy: {
          column: "name",
          order: "asc",
        },
      });

    if (error) {
      throw new Error(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    allFiles.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    offset += pageSize;

    if (offset > 10000) {
      break;
    }
  }

  return allFiles.filter((file) => {
    const name = String(file?.name ?? "");
    return name.toLowerCase().endsWith(".webp");
  });
}

function getPublicUrl(fileName: string) {
  const { data } = serviceClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/* =====================================================
   GET: Search existing menu item photos
   Example:
   /api/admin/menu-images?search=dal fry
===================================================== */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get("search") ?? "").trim();
    const normalizedSearch = normalizeForSearch(search);

    const allFiles = await listAllFiles();

    const matchingFiles = allFiles
      .filter((file) => {
        if (!normalizedSearch) {
          return true;
        }

        const normalizedFileName = normalizeForSearch(file.name);
        return normalizedFileName.includes(normalizedSearch);
      })
      .slice(0, 100)
      .map((file) => ({
        name: file.name,
        publicUrl: getPublicUrl(file.name),
        createdAt: file.created_at ?? null,
        updatedAt: file.updated_at ?? null,
        size: file.metadata?.size ?? null,
      }));

    return NextResponse.json({
      ok: true,
      rows: matchingFiles,
      total: matchingFiles.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/menu-images error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Failed to search menu images",
      },
      { status: 500 }
    );
  }
}

/* =====================================================
   POST: Upload new menu item photo

   FormData:
   file: .webp image
   photoName: manually entered photo name
===================================================== */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const fileValue = formData.get("file");
    const photoNameValue = formData.get("photoName");

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Photo file is required",
        },
        { status: 400 }
      );
    }

    const file = fileValue;
    const cleanPhotoName = sanitizePhotoName(photoNameValue);

    if (!cleanPhotoName) {
      return NextResponse.json(
        {
          ok: false,
          error: "Photo Name is required",
        },
        { status: 400 }
      );
    }

    const originalFileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    if (
      !originalFileName.endsWith(".webp") ||
      (fileType && fileType !== "image/webp")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only .webp image is allowed",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          error: "Image size must be maximum 50KB",
        },
        { status: 400 }
      );
    }

    const allFiles = await listAllFiles();

    const serialPattern = new RegExp(
      `^${escapeRegex(cleanPhotoName)}-(\\d+)\\.webp$`,
      "i"
    );

    let highestSerial = 0;

    for (const existingFile of allFiles) {
      const fileName = String(existingFile?.name ?? "");
      const match = fileName.match(serialPattern);

      if (!match) continue;

      const serial = Number(match[1]);

      if (Number.isFinite(serial) && serial > highestSerial) {
        highestSerial = serial;
      }
    }

    const nextSerial = highestSerial + 1;
    const finalFileName = `${cleanPhotoName}-${nextSerial}.webp`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .upload(finalFileName, buffer, {
        cacheControl: "3600",
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const publicUrl = getPublicUrl(finalFileName);

    return NextResponse.json({
      ok: true,
      fileName: finalFileName,
      publicUrl,
    });
  } catch (error: any) {
    console.error("POST /api/admin/menu-images error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Failed to upload menu image",
      },
      { status: 500 }
    );
  }
}
