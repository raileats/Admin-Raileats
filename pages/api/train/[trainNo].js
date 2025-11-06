// pages/api/train/[trainNo].js
// 🔹 Fetch Indian Railway train info from RapidAPI (serverless function)

export default async function handler(req, res) {
  const { trainNo } = req.query;

  if (!trainNo) {
    return res.status(400).json({ error: "Missing train number" });
  }

  const host = process.env.RAPIDAPI_HOST || "indian-railway-irctc.p.rapidapi.com";
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return res.status(500).json({ error: "Missing RAPIDAPI_KEY environment variable" });
  }

  // 🔸 RapidAPI endpoint
  const url = `https://${host}/api/v1/train/info?train_number=${encodeURIComponent(trainNo)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host,
      },
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    console.error("Error fetching train info:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
