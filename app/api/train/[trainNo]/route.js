// app/api/train/[trainNo]/route.js  (pure JS, put in app/api/train/[trainNo]/)
import { NextResponse } from "next/server";

/**
 * Proxy that will try a few candidate endpoints on the RapidAPI provider
 * and return first successful JSON (or aggregated errors for debugging).
 *
 * IMPORTANT:
 * - Set RAPIDAPI_KEY in Vercel environment variables.
 * - Set RAPIDAPI_HOST if provider host differs (default below).
 */

const DEFAULT_HOST = "indian-railway-irctc.p.rapidapi.com";

function buildCandidates(trainNo, searchParams) {
  // Candidate endpoint templates (add more as you see in provider docs)
  // Each candidate is { url, desc } where url is full URL string to fetch.
  const host = process.env.RAPIDAPI_HOST || DEFAULT_HOST;
  const q = new URLSearchParams(searchParams || {});
  q.set("train_number", String(trainNo));
  // Candidate 1: /api/v1/train/info
  const c1 = `https://${host}/api/v1/train/info?${q.toString()}`;
  // Candidate 2: /api/train/info (some providers)
  const c2 = `https://${host}/train/info?${q.toString()}`;
  // Candidate 3: /api/trains/v1/train/status  (uses departure_date maybe)
  const q2 = new URLSearchParams(searchParams || {});
  q2.set("train_number", String(trainNo));
  // keep existing departure_date param if provided
  const c3 = `https://${host}/api/trains/v1/train/status?${q2.toString()}`;
  // Candidate 4: /api/train/info?train_no= (different param name)
  const q3 = new URLSearchParams(searchParams || {});
  q3.set("train_no", String(trainNo));
  const c4 = `https://${host}/api/v1/train/info?${q3.toString()}`;

  return [
    { url: c1, desc: "api/v1/train/info (train_number)" },
    { url: c2, desc: "train/info (train_number)" },
    { url: c3, desc: "api/trains/v1/train/status (train_number + possible departure_date)" },
    { url: c4, desc: "api/v1/train/info (train_no param)" },
  ];
}

export async function GET(request, { params }) {
  const trainNo = params && params.trainNo;
  if (!trainNo) {
    return NextResponse.json({ ok: false, error: "Provide trainNo in URL path" }, { status: 400 });
  }

  const urlObj = new URL(request.url);
  // pass along any query params (like departure_date)
  const searchParams = {};
  for (const [k, v] of urlObj.searchParams.entries()) searchParams[k] = v;

  // quick test flag
  if (urlObj.searchParams.get("test") === "1") {
    return NextResponse.json({ ok: true, msg: "route working (app router)", trainNo: String(trainNo), note: "test flag" });
  }

  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || DEFAULT_HOST;

  if (!key) {
    return NextResponse.json({
      ok: false,
      error: "RAPIDAPI_KEY not configured in environment. Set RAPIDAPI_KEY in Vercel.",
      hint: "You can still test with ?test=1",
    }, { status: 400 });
  }

  const candidates = buildCandidates(trainNo, searchParams);

  const tried = [];
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": host,
          // provider sometimes requires extra headers - add if docs show any
        },
      });

      const text = await res.text().catch(() => "");
      // try parse JSON
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = null; }

      // record trial
      tried.push({
        url: c.url,
        desc: c.desc,
        status: res.status,
        ok: res.ok,
        bodyPreview: (typeof parsed === "object") ? parsed : (text ? (text.length > 800 ? text.slice(0, 800) + "..." : text) : null),
      });

      // if upstream returned OK json or 200, forward it
      if (res.ok) {
        // if parsed JSON, return it directly
        if (parsed !== null) {
          return NextResponse.json(parsed, { status: 200 });
        }
        // else return raw text
        return new Response(text || "", { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
      }

      // if res not ok, keep trying next candidate
    } catch (err) {
      tried.push({ url: c.url, desc: c.desc, error: String(err) });
    }
  }

  // If we reach here, all candidates failed - return aggregated debug info
  return NextResponse.json({
    ok: false,
    error: "All candidate endpoints failed. Check RAPIDAPI host/path or subscription.",
    tried,
    hint: "Open RapidAPI playground -> choose endpoint -> copy exact Request URL and params. Update RAPIDAPI_HOST if needed.",
  }, { status: 502 });
}
