// app/api/train/[trainNo]/route.js
import { NextResponse } from "next/server";

const DEFAULT_HOST = process.env.RAPIDAPI_HOST || "indian-railway-irctc.p.rapidapi.com";

function todayYYYYMMDDUTC() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

function buildCandidateUrls(host, trainNo, incomingSearchParams = {}) {
  const base = new URLSearchParams(incomingSearchParams);

  const q1 = new URLSearchParams(base);
  q1.set("train_number", String(trainNo));
  const q2 = new URLSearchParams(base);
  q2.set("train_no", String(trainNo));

  const candidates = [
    { url: `https://${host}/api/trains/v1/train/status?${q1.toString()}`, desc: "api/trains/v1/train/status (train_number)" },
    { url: `https://${host}/api/trains/v1/train/status?${q2.toString()}`, desc: "api/trains/v1/train/status (train_no)" },
    { url: `https://${host}/api/v1/train/info?${q1.toString()}`, desc: "api/v1/train/info (train_number) - maybe 404" },
    { url: `https://${host}/train/info?${q1.toString()}`, desc: "train/info (train_number) - maybe 404" },
  ];
  return candidates;
}

async function tryFetch(url, key, host) {
  const headers = {
    "x-rapidapi-key": key,
    "x-rapidapi-host": host,
  };
  const res = await fetch(url, { method: "GET", headers });
  const text = await res.text().catch(() => "");
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = null; }
  return { res, text, parsed };
}

export async function GET(request, { params }) {
  const trainNo = params && params.trainNo;
  if (!trainNo) {
    return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });
  }

  const requestUrl = new URL(request.url);

  // quick internal test
  if (requestUrl.searchParams.get("test") === "1") {
    return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo) });
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "RAPIDAPI_KEY not set in environment. Set it in Vercel." }, { status: 400 });
  }

  const host = process.env.RAPIDAPI_HOST || DEFAULT_HOST;

  const incomingParams = {};
  for (const [k, v] of requestUrl.searchParams.entries()) {
    incomingParams[k] = v;
  }

  const candidates = buildCandidateUrls(host, trainNo, incomingParams);
  const tried = [];

  for (const c of candidates) {
    try {
      const { res, text, parsed } = await tryFetch(c.url, key, host);

      tried.push({
        url: c.url,
        desc: c.desc,
        status: res.status,
        ok: res.ok,
        bodyPreview: parsed ?? (text || null),
      });

      // if success, return upstream body with same status or json
      if (res.ok) {
        if (parsed !== null) return NextResponse.json(parsed, { status: res.status });
        return new Response(text || "", { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
      }

      // if 400, maybe departure_date issue — try adding today's date (if not present)
      if (res.status === 400) {
        const bodyStr = parsed ? JSON.stringify(parsed) : (text || "");
        if (/departure_date/i.test(bodyStr) || /Invalid data for departure_date/i.test(bodyStr)) {
          const u = new URL(c.url);
          if (!u.searchParams.get("departure_date")) {
            u.searchParams.set("departure_date", todayYYYYMMDDUTC());
          }
          try {
            const { res: r2, text: t2, parsed: p2 } = await tryFetch(u.toString(), key, host);
            tried.push({ url: u.toString(), desc: c.desc + " (with departure_date)", status: r2.status, ok: r2.ok, bodyPreview: p2 ?? (t2 || null) });
            if (r2.ok) {
              if (p2 !== null) return NextResponse.json(p2, { status: r2.status });
              return new Response(t2 || "", { status: r2.status, headers: { "content-type": "text/plain; charset=utf-8" } });
            } else {
              // if provider explicitly says feature unsupported, return helpful message
              if (p2 && typeof p2 === "object" && /not supported/i.test(JSON.stringify(p2))) {
                return NextResponse.json({
                  ok: false,
                  error: "Provider reports that 'Live Train Status' is not supported on this RapidAPI app/version/subscription.",
                  provider_message: p2,
                  tried,
                  hint: "Open RapidAPI playground, confirm endpoint & check your app/version subscription.",
                }, { status: 402 });
              }
            }
          } catch (err2) {
            tried.push({ url: u.toString(), desc: c.desc + " (retry)", error: String(err2) });
          }
        }

        if (parsed && typeof parsed === "object" && /Live Train Status/i.test(JSON.stringify(parsed))) {
          return NextResponse.json({
            ok: false,
            error: "Provider reports that 'Live Train Status' feature is not supported on this version.",
            provider_message: parsed,
            tried,
            hint: "Upgrade RapidAPI app/version or use a different provider endpoint.",
          }, { status: 402 });
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
    hint: "Open RapidAPI playground -> choose endpoint -> copy exact Request URL & params and ensure RAPIDAPI_HOST matches.",
  }, { status: 502 });
}
