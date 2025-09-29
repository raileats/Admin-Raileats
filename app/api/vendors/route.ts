// app/api/vendors/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// Reuse same column set as restros
const COLUMNS = [
  'RestroCode','RestroName','OwnerName','StationCode','StationName',
  'OwnerPhone','OwnerEmail','FSSAINumber','FSSAIExpiryDate',
  'IRCTCStatus','RaileatsStatus','IsIrctcApproved'
].join(',');

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';
    // Keep same filter style your frontend expects (adjust as needed)
    let query = supabaseServer.from('RestroMaster').select(COLUMNS).order('RestroName', { ascending: true }).limit(1000);

    if (q) {
      // example: support a simple ilike OR across common fields
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

// optional: if frontend sends POST to /api/vendors to create a vendor
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.RestroCode || !body.RestroName) {
      return NextResponse.json({ error: 'RestroCode and RestroName required' }, { status: 400 });
    }
    const { data, error } = await supabaseServer.from('RestroMaster').insert([body]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
