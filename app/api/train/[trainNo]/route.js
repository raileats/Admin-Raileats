// app/api/train/[trainNo]/route.js  (Pure JS - no TypeScript types)
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const trainNo = params && params.trainNo;
  if (!trainNo) {
    return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });
  }

  const urlObj = new URL(request.url);
  if (urlObj.searchParams.get("test") === "1") {
    return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo) });
  }

  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || "indian-railway-irctc.p.rapidapi.com";

  const departureDate = urlObj.searchParams.get("departure_date") || urlObj.searchParams.get("date");
  let targetUrl;

  if (departureDate) {
    const q = new URLSearchParams(urlObj.searchParams);
    q.set("train_number", String(trainNo));
    targetUrl = "https://" + host + "/api/trains/v1/train/status?" + q.toString();
  } else {
    const q = new URLSearchParams();
    q.set("train_number", String(trainNo));
    targetUrl = "https://" + host + "/api/v1/train/info?" + q.toString();
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
      },
    });

    const text = await upstream.text();
    try {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json, { status: upstream.ok ? 200 : upstream.status });
    } catch (e) {
      return new Response(text, {
        status: upstream.ok ? 200 : upstream.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Proxy failed", details: String(err) }, { status: 500 });
  }
}
