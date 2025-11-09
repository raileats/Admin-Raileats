// app/api/train/[trainNo]/route.js
import { NextResponse } from "next/server";

const DEFAULT_HOST = process.env.RAPIDAPI_HOST || "indian-railway-irctc.p.rapidapi.com";

function yyyymmddForDate(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

function buildCandidates(trainNo, searchParams) {
  const host = DEFAULT_HOST;
  // base params from user (querystring)
  const base = new URLSearchParams(searchParams || {});
  // keep both variants as options
  const q1 = new URLSearchParams(base);
  q1.set("train_number", String(trainNo));
  const q2 = new URLSearchParams(base);
  q2.set("train_no", String(trainNo));

  // candidate: trains status (may need departure_date)
  const c_status_1 = `https://${host}/api/trains/v1/train/status?${q1.toString()}`;
  const c_status_2 = `https://${host}/api/trains/v1/train/status?${q2.toString()}`;

  // fallback raw train/info patterns (many give 404 on this provider)
  const c_info_1 = `https://${host}/api/v1/train/info?${q1.toString()}`;
  const c_info_2 = `https://${host}/train/info?${q1.toString()}`;

  return [
    { url: c_status_1, desc: "api/trains/v1/train/status (train_number)" },
    { url: c_status_2, desc: "api/trains/v1/train/status (train_no)" },
    { url: c_info_1, desc: "api/v1/train/info (train_number) - likely 404" },
    { url: c_info_2, desc: "train/info (train_number) - likely 404" },
  ];
}

export async function GET(request, { params }) {
  const trainNo = params && params.trainNo;
  if (!trainNo) return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });

  const reqUrl = new URL(request.url);
  // collect any incoming query params (e.g., if you passed departure_date manually)
  const incoming = {};
  for (const [k, v] of reqUrl.searchParams.entries()) incoming[k] = v;

  if (reqUrl.searchParams.get("test") === "1") {
    return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo) });
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "RAPIDAPI_KEY not set in environment. Set in Vercel." }, { status: 400 });
  }

  const host = process.env.RAPIDAPI_HOST || DEFAULT_HOST;
  const candidates = buildCandidates(trainNo, incoming);

  const tried = [];

  // Try each candidate once. If status 400 about departure_date, retry same endpoint with a default date.
  for (const c of candidates) {
    try {
      let res = await fetch(c.url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": host,
        },
      });

      const text = await res.text().catch(() => "");
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = null; }

      tried.push({ url: c.url, desc: c.desc, status: res.status, ok: res.ok, bodyPreview: parsed ?? (text || null) });

      // If OK => forward result
      if (res.ok) {
        if (parsed !== null) return NextResponse.json(parsed, { status: 200 });
        return new Response(text || "", { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
      }

      // If 400 and message says departure_date invalid or missing, retry with today's date (YYYYMMDD)
      if (res.status === 400) {
        const bodyText = typeof parsed === "object" ? JSON.stringify(parsed) : text || "";
        if (/departure_date/i.test(bodyText) || /Invalid data for departure_date/i.test(bodyText)) {
          // build new URL with departure_date set (prefer incoming param if provided else today)
          const u = new URL(c.url);
          if (!u.searchParams.get("departure_date")) {
            u.searchParams.set("departure_date", yyyymmddForDate());
          }
          // retry
          try {
            const res2 = await fetch(u.toString(), {
              method: "GET",
              headers: {
                "x-rapidapi-key": key,
                "x-rapidapi-host": host,
              },
            });
            const t2 = await res2.text().catch(() => "");
            let p2 = null;
            try { p2 = t2 ? JSON.parse(t2) : null; } catch (e) { p2 = null; }

            tried.push({ url: u.toString(), desc: c.desc + " (with departure_date)", status: res2.status, ok: res2.ok, bodyPreview: p2 ?? (t2 || null) });

            if (res2.ok) {
              if (p2 !== null) return NextResponse.json(p2, { status: 200 });
              return new Response(t2 || "", { status: res2.status, headers: { "content-type": "text/plain; charset=utf-8" } });
            }
          } catch (err2) {
            tried.push({ url: c.url + " (retry)", error: String(err2) });
          }
        }
      }
      // otherwise continue to next candidate
    } catch (err) {
      tried.push({ url: c.url, desc: c.desc, error: String(err) });
    }
  }

  return NextResponse.json({
    ok: false,
    error: "All candidate endpoints failed. Check RAPIDAPI host/path or subscription.",
    tried,
    hint: "Open RapidAPI playground, choose 'Get Train Live Status' endpoint, copy exact request URL & params and pass departure_date if required.",
  }, { status: 502 });
}
