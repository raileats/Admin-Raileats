// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

type ReqUserBody = {
  name?: string;
  user_type?: string;
  mobile?: string;
  password?: string;
  email?: string | null;
  dob?: string | null;
  photo_url?: string | null;
};

// ✅ GET - list users
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const user_type = url.searchParams.get("user_type") || "";

    const baseSelect = `id, seq, user_id, name, user_type, mobile, email, dob, photo_url, status, created_at, updated_at`;

    let query = supabaseServer.from("users").select(baseSelect).order("seq", { ascending: true });

    if (q) {
      const { data, error } = await query.or(`name.ilike.%${q}%,mobile.ilike.%${q}%`);
      if (error) throw error;
      const filtered = user_type ? data?.filter((r: any) => r.user_type === user_type) : data;
      return NextResponse.json({ users: filtered || [] });
    }

    if (user_type) {
      const { data, error } = await query.eq("user_type", user_type);
      if (error) throw error;
      return NextResponse.json({ users: data || [] });
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ users: data || [] });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}

// ✅ POST - add user (server-side hash -> password_hash + auto user_id using seq fallback)
export async function POST(request: Request) {
  try {
    const body: ReqUserBody = await request.json();
    const { name, user_type, mobile, password, email, dob, photo_url } = body;

    if (!name || !password) {
      return NextResponse.json(
        { message: "name and password required" },
        { status: 400 }
      );
    }

    // ---------------------------
    //  Determine next user_id (numeric):
    //  Prefer numeric max of seq; fallback: numeric parse of user_id column.
    // ---------------------------
    let nextUserIdNum = 101; // default start

    try {
      // try max seq first (numeric)
      const { data: seqRows, error: seqErr } = await supabaseServer
        .from("users")
        .select("seq")
        .order("seq", { ascending: false })
        .limit(1);

      if (!seqErr && seqRows && seqRows.length > 0 && seqRows[0].seq != null) {
        const maxSeq = Number(seqRows[0].seq);
        if (!Number.isNaN(maxSeq)) {
          nextUserIdNum = maxSeq + 1;
        }
      } else {
        // fallback - read user_id values and compute numeric max
        const { data: uids, error: uidErr } = await supabaseServer
          .from("users")
          .select("user_id")
          .not("user_id", "is", null)
          .limit(2000); // increase if you have >2k users

        if (!uidErr && Array.isArray(uids) && uids.length > 0) {
          let max = 0;
          for (const r of uids) {
            const v = r.user_id;
            const n = Number(String(v).trim());
            if (!Number.isNaN(n) && n > max) max = n;
          }
          if (max > 0) nextUserIdNum = max + 1;
        }
      }
    } catch (e) {
      console.warn("next user id calc failed, using default", e);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const insertObj: any = {
      name,
      user_type,
      mobile,
      password_hash,
      status: true,
      email: email ?? null,
      dob: dob ?? null,
      photo_url: photo_url ?? null,
      user_id: String(nextUserIdNum),
      // do NOT set seq here — DB should handle seq via sequence/default
    };

    const { data, error } = await supabaseServer
      .from("users")
      .insert([insertObj])
      .select("id, seq, user_id, name, user_type, mobile, email, dob, photo_url, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json(
      { message: err.message || String(err) },
      { status: 500 }
    );
  }
}
