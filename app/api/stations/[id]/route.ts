// app/api/stations/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();

    // If StationId is numeric PK in your DB, convert: const pkVal = Number(id);
    const pkColumn = 'StationId'; // change to 'stationid' or 'id' if your DB uses that

    // Only allow certain fields to be updated to avoid accidental column injection
    const allowed = new Set([
      'StationName','StationCode','Category','EcatRank','Division',
      'RailwayZone','EcatZone','District','State','Lat','Long','Address','ReGroup','is_active'
    ]);

    const updates: any = {};
    for (const k of Object.keys(body || {})) {
      if (allowed.has(k)) updates[k] = body[k];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('Stations')
      .update(updates)
      .eq(pkColumn, id)
      .select()
      .single();

    if (error) {
      console.error('supabase update error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('PATCH /api/stations/[id] error', e);
    return NextResponse.json({ error: e.message ?? 'unknown' }, { status: 500 });
  }
}
