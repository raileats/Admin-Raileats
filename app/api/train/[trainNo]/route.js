// app/api/train/[trainNo]/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { trainNo?: string } }) {
  try {
    const trainNo = params?.trainNo;
    if (!trainNo) {
      return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });
    }

    // quick test without API key
    const urlObj = new URL(request.url);
    if (urlObj.searchParams.get("test") === "1") {
      return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo) });
    }

    const key = process.env.RAPIDAPI_KEY;
    const host = process.env.RAPIDAPI_HOST ?? "indian-railway-irctc.p.rapidapi.com";

    if (!key) {
      return NextResponse.json({
        ok: true,
        info: "Route exists. RAPIDAPI_KEY not set — set it in Vercel to enable proxy.",
        trainNo: String(trainNo),
        testHint: "Add ?test=1 to quickly test",
      });
    }

    const target = `https://${host}/api/v1/train/info?train_number=${encodeURIComponent(String(trainNo))}`;

    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host,
      },
    });

    const text = await upstream.text();
    try {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json, { status: upstream.ok ? 200 : upstream.status });
    } catch {
      // upstream returned non-json - forward raw text
      return new Response(text, {
        status: upstream.ok ? 200 : upstream.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  } catch (err: any) {
    console.error("train route error:", err);
    return NextResponse.json({ ok: false, error: "Proxy failed", details: String(err) }, { status: 500 });
  }
}
