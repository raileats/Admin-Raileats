// app/api/admin/menu-images/route.ts

import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "menu_item_image";
const MAX_FILE_SIZE = 50 * 1024;

function cleanUploadedFileName(value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .pop();

  if (!raw) return "";

  const withoutExtension = raw.replace(/\.webp$/i, "").trim();

  const cleanBaseName = withoutExtension
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\/\\:*?"<>|#%]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .trim();

  if (!cleanBaseName) return "";

  return `${cleanBaseName}.webp`;
}

function normalizeForSearch(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.webp$/i, "")
    .replace(/[_\s-]+/g, "");
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

    return (
      name &&
      name.toLowerCase().endsWith(".webp") &&
      file?.id
    );
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

    const search = String(
      searchParams.get("search") ?? ""
    ).trim();

    const normalizedSearch = normalizeForSearch(search);

    const allFiles = await listAllFiles();

    const matchingFiles = allFiles
      .filter((file) => {
        if (!normalizedSearch) {
          return true;
        }

        const normalizedFileName = normalizeForSearch(
          file.name
        );

        return normalizedFileName.includes(
          normalizedSearch
        );
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
    console.error(
      "GET /api/admin/menu-images error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ??
          "Failed to search menu images",
      },
      { status: 500 }
    );
  }
}

/* =====================================================
   POST: Upload new menu item photo

   FormData:
   file: selected .webp image

   The actual selected file name will be used.
   Example:
   Dal Fry.webp
   Dal Fry 2.webp
   Dal Fry 3.webp
===================================================== */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const fileValue = formData.get("file");

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

    const originalFileName = String(
      file.name ?? ""
    ).trim();

    if (!originalFileName) {
      return NextResponse.json(
        {
          ok: false,
          error: "Selected file name is missing",
        },
        { status: 400 }
      );
    }

    if (!originalFileName.toLowerCase().endsWith(".webp")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only .webp image is allowed",
        },
        { status: 400 }
      );
    }

    const fileType = String(file.type ?? "").toLowerCase();

    if (fileType && fileType !== "image/webp") {
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

    if (file.size <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Selected image file is empty",
        },
        { status: 400 }
      );
    }

    const finalFileName =
      cleanUploadedFileName(originalFileName);

    if (!finalFileName) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid image filename. Please rename the file and try again.",
        },
        { status: 400 }
      );
    }

    const allFiles = await listAllFiles();

    const alreadyExists = allFiles.some(
      (existingFile) =>
        String(existingFile?.name ?? "").toLowerCase() ===
        finalFileName.toLowerCase()
    );

    if (alreadyExists) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${finalFileName}" already exists. Rename your file like "Dal Fry 2.webp" and upload again.`,
        },
        { status: 409 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } =
      await serviceClient.storage
        .from(BUCKET_NAME)
        .upload(finalFileName, buffer, {
          cacheControl: "3600",
          contentType: "image/webp",
          upsert: false,
        });

    if (uploadError) {
      if (
        String(uploadError.message ?? "")
          .toLowerCase()
          .includes("already exists")
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: `"${finalFileName}" already exists. Rename your file like "Dal Fry 2.webp" and upload again.`,
          },
          { status: 409 }
        );
      }

      throw new Error(uploadError.message);
    }

    const publicUrl = getPublicUrl(finalFileName);

    return NextResponse.json({
      ok: true,
      fileName: finalFileName,
      publicUrl,
    });
  } catch (error: any) {
    console.error(
      "POST /api/admin/menu-images error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ??
          "Failed to upload menu image",
      },
      { status: 500 }
    );
  }
}
