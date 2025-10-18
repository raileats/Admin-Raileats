// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs"; // keep nodejs for Buffer support on Vercel

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "file required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `user-photos/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;

    const { data, error } = await supabaseServer.storage
      .from("user-photos")
      .upload(filename, buffer, { contentType: file.type });

    if (error) {
      console.error("storage upload error:", error);
      return NextResponse.json({ message: "Photo upload failed" }, { status: 500 });
    }

    const publicRes = supabaseServer.storage.from("user-photos").getPublicUrl(data.path);
    const publicUrl = (publicRes as any)?.data?.publicUrl ?? null;

    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch (err: any) {
    console.error("upload route error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}
