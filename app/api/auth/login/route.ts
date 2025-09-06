import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { phone, password } = await req.json();
  // === validate credentials (DB or static check) ===
  if (phone === "8799726485" && password === "12234567890") {
    const res = NextResponse.json({ ok: true });
    // set a cookie (example)
    res.cookies.set("admin_auth", "some-signed-token", { httpOnly: true, path: "/" });
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
