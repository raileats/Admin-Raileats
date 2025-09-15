// app/api/restros/[code]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const ALLOWED = new Set([
  'RestroName','OwnerName','StationCode','StationName','OwnerPhone',
  'FSSAINumber','FSSAIExpiryDate','IRCTCStatus','RaileatsStatus','IsIrctcApproved'
]);

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const code = params.code;
    const body = await req.json();

    const updates: any = {};
    for (const k of Object.keys(body || {})) {
      if (ALLOWED.has(k)) updates[k] = body[k];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('RestroMaster')
      .update(updates)
      .eq('RestroCode', code)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
