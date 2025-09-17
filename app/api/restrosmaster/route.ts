// app/api/restromaster/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // use the new lib

const TABLENAME = 'RestroMaster'; // ensure this matches your Supabase table name

function sanitizeSearch(q: string) {
  // basic sanitize: remove characters that could break the .or expression
  return q.replace(/[%_']/g, '').trim();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = (url.searchParams.get('q') || '').trim();
    const q = sanitizeSearch(qRaw);

    // Use '*' for debugging; replace with specific COLUMNS later
    let builder = supabaseServer.from(TABLENAME).select('*').order('RestroName', { ascending: true }).limit(1000);

    if (q) {
      // build ilike OR conditions
      // Note: supabase-js expects the `.or()` string comma-separated
      const pattern = `%${q}%`;
      builder = supabaseServer
        .from(TABLENAME)
        .select('*')
        .or(
          `RestroCode.ilike.${pattern},RestroName.ilike.${pattern},OwnerName.ilike.${pattern},StationCode.ilike.${pattern}`
        )
        .order('RestroName', { ascending: true })
        .limit(1000);
    }

    const { data, error } = await builder;
    if (error) {
      console.error('GET /api/restromaster error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error('GET /api/restromaster unexpected', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const code = body?.RestroCode;
    if (!code) return NextResponse.json({ error: 'RestroCode required' }, { status: 400 });

    const allowed = new Set([
      'RestroName',
      'OwnerName',
      'StationCode',
      'StationName',
      'OwnerPhone',
      'OwnerEmail',
      'FSSAINumber',
      'FSSAIExpiryDate',
      'IRCTCStatus',
      'RaileatsStatus',
      'IsIrctcApproved',
    ]);
    const updates: any = {};
    for (const k of Object.keys(body)) if (allowed.has(k)) updates[k] = body[k];

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

    const { data, error } = await supabaseServer
      .from(TABLENAME)
      .update(updates)
      .eq('RestroCode', code)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/restromaster update error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('PATCH /api/restromaster unexpected', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.RestroCode || !body.RestroName) return NextResponse.json({ error: 'RestroCode & RestroName required' }, { status: 400 });

    const { data, error } = await supabaseServer.from(TABLENAME).insert([body]).select().single();
    if (error) {
      console.error('POST /api/restromaster insert error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/restromaster unexpected', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
