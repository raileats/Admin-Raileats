// pages/api/admin/users/index.ts (or app/api/admin/users/route.ts for app router)
// Node / Next.js api route example using supabase-js v2 style
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side only
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { name, mobile, password, user_type, seq } = req.body;

      if (!name || !mobile || !password) {
        return res.status(400).json({ message: "name, mobile and password are required" });
      }

      // normalize mobile if needed
      const mobileNorm = String(mobile).trim();

      // Hash password securely
      const saltRounds = 10;
      const hashed = await bcrypt.hash(password, saltRounds);

      // Create new user row in "users" table. Column names must match your DB.
      const insertBody: any = {
        name,
        mobile: mobileNorm,
        password: hashed, // store hashed password
        user_type: user_type || "Support",
        status: true, // active by default
      };
      if (seq) insertBody.seq = seq;

      const { data, error } = await supabase
        .from("users")
        .insert([insertBody])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ message: "DB insert failed", details: error.message });
      }

      // optionally: also create in supabase auth (if you use supabase auth for login)
      // Example (uncomment if you want to create an auth user):
      /*
      const { data: a, error: e } = await supabase.auth.admin.createUser({
        email: `${mobileNorm}@phone.local`, // only if you use email for supabase auth
        password,
        user_metadata: { name, mobile: mobileNorm, user_type },
        email_confirm: true
      });
      if (e) console.warn("Could not create supabase auth user:", e);
      */

      return res.status(201).json({ ok: true, user: data });
    } catch (err) {
      console.error("create-user error:", err);
      return res.status(500).json({ message: "Server error", error: String(err) });
    }
  } else if (req.method === "GET") {
    // optional: return users list
    const q = req.query.q as string | undefined;
    const user_type = req.query.user_type as string | undefined;
    const supaRes = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (supaRes.error) return res.status(500).json({ message: supaRes.error.message });
    let users = supaRes.data || [];
    // filtering server-side for reliability
    if (q) {
      users = users.filter((u: any) => (u.name || "").toLowerCase().includes(String(q).toLowerCase()) || (u.mobile||"").includes(q));
    }
    if (user_type) users = users.filter((u: any) => u.user_type === user_type);
    return res.status(200).json({ users });
  } else {
    res.setHeader("Allow", ["POST","GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
