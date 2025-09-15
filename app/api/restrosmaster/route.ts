// app/api/restromaster/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer'; // ensure this file exists as earlier

const COLUMNS = [
  'RestroCode','RestroName','OwnerName','StationCode','StationName',
  'OwnerPhone','OwnerEmail','FSSAINumber','FSSAIExpiryDate',
  'IRCTCStatus','RaileatsStatus','IsIrctcApproved'
].join(',');

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();

    let query = supabaseServer.from('RestroMaster').select(COLUMNS).order('RestroName', { ascending: true }).limit(1000);

    if (q) {
      query = supabaseServer
        .from('RestroMaster')
        .select(COLUMNS)
        .or(`RestroCode.ilike.%${q}%,RestroName.ilike.%${q}%,OwnerName.ilike.%${q}%,StationCode.ilike.%${q}%`)
        .order('RestroName', { ascending: true })
        .limit(1000);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// PATCH for update by RestroCode (optional)
export async function PATCH(req: Request, { params }: { params?: any }) {
  try {
    const body = await req.json();
    const code = body?.RestroCode ?? null;
    if (!code) return NextResponse.json({ error: 'RestroCode required' }, { status: 400 });

    const updates: any = {};
    const allowed = new Set(['RestroName','OwnerName','StationCode','StationName','OwnerPhone','OwnerEmail','FSSAINumber','FSSAIExpiryDate','IRCTCStatus','RaileatsStatus','IsIrctcApproved']);
    for (const k of Object.keys(body)) if (allowed.has(k)) updates[k] = body[k];

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('RestroMaster')
      .update(updates)
      .eq('RestroCode', code)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// POST to create new restro (optional)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.RestroCode || !body.RestroName) return NextResponse.json({ error: 'RestroCode & RestroName required' }, { status: 400 });
    const { data, error } = await supabaseServer.from('RestroMaster').insert([body]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
