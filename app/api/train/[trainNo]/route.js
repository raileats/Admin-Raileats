// app/api/train/[trainNo]/route.js
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const trainNo = params && params.trainNo;
  if (!trainNo) {
    return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });
  }

  // quick smoke test: add ?test=1 to URL to verify route without external call
  try {
    const urlObj = new URL(request.url);
    if (urlObj.searchParams.get("test") === "1") {
      return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo) });
    }
  } catch (e) {
    // ignore
  }

  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || "";

  if (!key || !host) {
    return NextResponse.json({
      ok: false,
      error: "RAPIDAPI_KEY or RAPIDAPI_HOST not configured in environment",
      hint: "Set RAPIDAPI_KEY and RAPIDAPI_HOST in Vercel (or .env for local)."
    }, { status: 500 });
  }

  // candidate endpoint paths (try common variants)
  const candidatePaths = [
    "/api/v1/train/info?train_number=",
    "/api/v1/train/info?train_no=",
    "/api/v1/train/info?trainNo=",
    "/api/v1/train/info?train=",
    "/api/v1/train?train_number=",
    "/api/train/info?train_number=",
    "/train/info?train_number=",
    "/train/info?train="
  ];

  const tried = [];

  for (const base of candidatePaths) {
    const target = `https://${host}${base}${encodeURIComponent(String(trainNo))}`;
    try {
      const upstream = await fetch(target, {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": host,
          "Accept": "application/json, text/*"
        }
      });

      const status = upstream.status;
      const text = await upstream.text().catch(() => "");
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

      tried.push({ url: target, status, ok: upstream.ok, body: json ?? text });

      if (upstream.ok) {
        if (json !== null) return NextResponse.json(json, { status });
        return new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8" }});
      }
      // otherwise try next candidate
    } catch (err) {
      tried.push({ url: target, error: String(err) });
    }
  }

  return NextResponse.json({
    ok: false,
    error: "All candidate endpoints failed. Check RAPIDAPI host/path or subscription.",
    tried,
    hint: "Open the API docs on RapidAPI and confirm exact path & param name, or paste 'tried' here."
  }, { status: 502 });
}
