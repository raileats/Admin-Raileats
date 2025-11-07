// pages/api/train/[trainNo].js
// Minimal test + proxy handler for RapidAPI (works without local dev)

export default async function handler(req, res) {
  const { trainNo } = req.query;

  // Basic check
  if (!trainNo) {
    return res.status(400).json({ ok: false, error: "Provide trainNo in URL path" });
  }

  // Quick test response so we can confirm route exists without RapidAPI
  // Visit: /api/train/123?test=1 to see test response
  if (req.query.test === "1") {
    return res.status(200).json({ ok: true, msg: "route working", trainNo: String(trainNo) });
  }

  // If RAPIDAPI_KEY not set in environment, return info (so you can see it's working)
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || "indian-railway-irctc.p.rapidapi.com";
  if (!key) {
    return res.status(200).json({
      ok: true,
      info: "Route exists. RAPIDAPI_KEY not set — set it in Vercel env vars to enable proxy.",
      trainNo: String(trainNo),
      testHint: "Add ?test=1 to skip proxy",
    });
  }

  // Proxy to RapidAPI (only if key present)
  const url = `https://${host}/api/v1/train/info?train_number=${encodeURIComponent(String(trainNo))}`;
  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host,
      },
    });

    const text = await upstream.text();
    try {
      const json = text ? JSON.parse(text) : null;
      return res.status(upstream.ok ? 200 : upstream.status).json(json);
    } catch (e) {
      // non-json response
      return res.status(upstream.ok ? 200 : upstream.status).send(text);
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Proxy failed", details: String(err) });
  }
}
