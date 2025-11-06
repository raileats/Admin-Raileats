import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Get train route or status
router.get("/:trainNo", async (req, res) => {
  const trainNo = req.params.trainNo;
  const url = `https://indian-railway-irctc.p.rapidapi.com/api/v1/train/info?train_number=${trainNo}`;

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "YOUR_API_KEY",  // <-- Replace with your key
      "x-rapidapi-host": "indian-railway-irctc.p.rapidapi.com"
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch train info" });
  }
});

export default router;
