// pages/api/auth/login.ts (or app/api/auth/login/route.ts)
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone, password } = req.body || {};
  if (!phone || !password) return res.status(400).json({ message: "phone and password required" });

  // fetch user by phone/mobile
  const { data, error } = await supabase
    .from("users")
    .select("id, name, mobile, password, status, user_type")
    .eq("mobile", phone)
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user: any = data;
  if (!user.status) return res.status(403).json({ message: "User blocked" });

  const match = await bcrypt.compare(password, user.password || "");
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  // success — set cookie/session token as you do now
  // example: create a signed cookie or jwt here
  // res.setHeader('Set-Cookie', ...)

  return res.status(200).json({ ok: true, user: { id: user.id, name: user.name, user_type: user.user_type } });
}
