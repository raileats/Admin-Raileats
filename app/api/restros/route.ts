// app/api/restros/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const COLUMNS = [
  'RestroCode','RestroName','OwnerName','StationCode','StationName',
  'OwnerPhone','OwnerEmail','FSSAINumber','FSSAIExpiryDate',
  'IRCTCStatus','RaileatsStatus','IsIrctcApproved'
].join(',');

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';

    let query = supabaseServer.from('RestroMaster').select(COLUMNS).order('RestroName', { ascending: true }).limit(1000);

    if (q) {
      // search across a few fields
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
