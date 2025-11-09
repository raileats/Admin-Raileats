// app/api/train/[trainNo]/route.js
import { NextResponse } from "next/server";

function fillTemplate(tpl, trainNo, date) {
  return tpl
    .replaceAll("{trainNo}", encodeURIComponent(String(trainNo)))
    .replaceAll("{train_number}", encodeURIComponent(String(trainNo)))
    .replaceAll("{date}", encodeURIComponent(String(date ?? "")));
}

export async function GET(request, { params }) {
  const trainNo = params?.trainNo;
  if (!trainNo) return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });

  // quick smoke test
  try {
    const u = new URL(request.url);
    if (u.searchParams.get("test") === "1") {
      return NextResponse.json({ ok: true, msg: "route working", trainNo: String(trainNo) });
    }
  } catch (e) {}

  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST;
  const tpl = process.env.RAPIDAPI_PATH_TEMPLATE || "/api/v1/train/info?train_number={trainNo}";

  if (!key || !host) {
    return NextResponse.json({ ok: false, error: "RAPIDAPI_KEY or RAPIDAPI_HOST not set" }, { status: 500 });
  }

  // allow client to pass date param for live-status: ?date=2025-11-09
  let dateFromClient = null;
  try {
    const ru = new URL(request.url);
    dateFromClient = ru.searchParams.get("date");
  } catch {}

  const path = fillTemplate(tpl, trainNo, dateFromClient);
  const target = `https://${host}${path}`;

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host,
        "Accept": "application/json,text/*"
      }
    });

    const status = upstream.status;
    const text = await upstream.text().catch(() => "");

    try {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json, { status });
    } catch {
      return new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Proxy failed", details: String(err) }, { status: 500 });
  }
}
