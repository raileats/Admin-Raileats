// app/api/train/[trainNo]/route.ts
import { NextResponse } from "next/server";

type Params = { params?: { trainNo?: string } };

export async function GET(request: Request, { params }: Params) {
  const trainNo = params?.trainNo;
  if (!trainNo) {
    return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });
  }

  // Quick local test without calling RapidAPI:
  try {
    const urlObj = new URL(request.url);
    if (urlObj.searchParams.get("test") === "1") {
      return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo) });
    }
  } catch {
    // ignore parsing errors
  }

  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST ?? "";

  if (!key || !host) {
    return NextResponse.json({
      ok: false,
      error: "RAPIDAPI_KEY or RAPIDAPI_HOST not configured in environment",
      hint: "Set RAPIDAPI_KEY and RAPIDAPI_HOST in Vercel (or .env for local).",
    }, { status: 500 });
  }

  // Candidate paths to try (common variants). RapidAPI endpoints differ by provider.
  const candidatePaths = [
    "/api/v1/train/info?train_number=",   // common
    "/api/v1/train/info?train_no=",
    "/api/v1/train/info?trainNo=",
    "/api/v1/train/info?train=",
    "/api/v1/train/info?number=",
    "/api/v1/train/info?train_number=",   // duplicate just in case
    "/api/v1/train?train_number=",
    "/api/v1/train?train_no=",
    "/train/info?train_number=",
    "/train/info?train=",
    "/api/train/info?train_number=",
  ];

  // Try each candidate until one returns 200-ish
  const tried: Array<{ url: string; status?: number; ok?: boolean; body?: any; error?: string }> = [];

  for (const pathBase of candidatePaths) {
    const target = `https://${host}${pathBase}${encodeURIComponent(String(trainNo))}`;
    try {
      const upstream = await fetch(target, {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": host,
          "Accept": "application/json, text/*",
        },
      });

      const status = upstream.status;
      const text = await upstream.text().catch(() => "");

      // try parse JSON if possible
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }

      tried.push({ url: target, status, ok: upstream.ok, body: parsed ?? text });

      // if upstream returned 2xx or has JSON body that looks valid, return it
      if (upstream.ok) {
        // if parsed JSON -> return JSON, else return raw text
        if (parsed !== null) {
          return NextResponse.json(parsed, { status });
        } else {
          return new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
        }
      } else {
        // continue trying other candidates
        // but if API explicitly says "endpoint doesn't exist" we collect and continue.
      }
    } catch (err: any) {
      tried.push({ url: target, error: String(err) });
      // continue trying other candidates
    }
  }

  // If we are here -> nothing worked. Return helpful debug info.
  return NextResponse.json({
    ok: false,
    error: "All candidate endpoints failed. Check RAPIDAPI host/path or subscription.",
    info: "We tried several common endpoint paths for this RAPIDAPI host. See 'tried' for details.",
    tried,
    hint: "Open the API's docs on RapidAPI and copy the exact path and query param name. Or paste the 'tried' output to me and I will pick the correct path.",
  }, { status: 502 });
}
