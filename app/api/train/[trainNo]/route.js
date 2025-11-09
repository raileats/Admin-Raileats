// app/api/train/[trainNo]/route.ts
import { NextResponse } from "next/server";

type Params = { params?: { trainNo?: string } };

export async function GET(request: Request, { params }: Params) {
  const trainNo = params?.trainNo;
  if (!trainNo) {
    return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });
  }

  // Quick local test
  const urlObj = new URL(request.url);
  if (urlObj.searchParams.get("test") === "1") {
    return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo) });
  }

  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST ?? "indian-railway-irctc.p.rapidapi.com";

  // Decide which upstream path to call:
  // - If caller provided departure_date or date -> use the 'status' endpoint (needs date param)
  // - Otherwise use the 'info' endpoint which just wants train_number
  const departureDate = urlObj.searchParams.get("departure_date") ?? urlObj.searchParams.get("date");
  let targetUrl: string;

  if (departureDate) {
    // Use the endpoint pattern seen in playground: /api/trains/v1/train/status
    // We forward all query params present in the incoming request but ensure train_number is present.
    const q = new URLSearchParams(urlObj.searchParams as any);
    q.set("train_number", String(trainNo));
    targetUrl = `https://${host}/api/trains/v1/train/status?${q.toString()}`;
  } else {
    // Use the info endpoint: /api/v1/train/info?train_number=...
    const q = new URLSearchParams();
    q.set("train_number", String(trainNo));
    // If caller passed additional query params, forward the most common ones
    // (but keep this simple: info endpoint typically just needs train_number)
    targetUrl = `https://${host}/api/v1/train/info?${q.toString()}`;
  }

  if (!key) {
    return NextResponse.json({
      ok: true,
      info: "Route exists. RAPIDAPI_KEY not set in environment — set it in Vercel to enable proxy.",
      try: { testHint: "Add ?test=1 to quickly test", target: targetUrl },
    });
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host,
        // You may add Accept or User-Agent if needed
      },
    });

    const text = await upstream.text();
    // try parse JSON, otherwise forward raw text
    try {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json, { status: upstream.ok ? 200 : upstream.status });
    } catch {
      return new Response(text, {
        status: upstream.ok ? 200 : upstream.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Proxy failed", details: String(err) }, { status: 500 });
  }
}
