// app/api/stations/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';

    const cols = [
      'StationId','StationName','StationCode','Category','EcatRank','Division',
      'RailwayZone','EcatZone','District','State','Lat','Long','Address','ReGroup','is_active'
    ].join(',');

    let result;
    if (q) {
      result = await supabaseServer
        .from('Stations')
        .select(cols)
        .or(`StationName.ilike.%${q}%,StationCode.ilike.%${q}%`)
        .order('StationName', { ascending: true })
        .limit(200);
    } else {
      result = await supabaseServer
        .from('Stations')
        .select(cols)
        .order('StationName', { ascending: true })
        .limit(200);
    }

    const { data, error } = result;
    if (error) {
      console.error('supabase list error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error('api/stations GET error', e);
    return NextResponse.json({ error: e.message ?? 'unknown' }, { status: 500 });
  }
}
