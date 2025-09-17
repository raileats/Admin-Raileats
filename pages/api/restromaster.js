// pages/api/restromaster.js  (temporary fallback)
export default async function handler(req, res) {
  // Optional: you can proxy to your app router endpoint or return sample data.
  // Simple sample response so UI shows something immediately:
  const sample = [
    { RestroCode: "T1", RestroName: "Test Restro", OwnerName: "Ops", StationCode: "ABC" }
  ];
  return res.status(200).json({ data: sample });
}
