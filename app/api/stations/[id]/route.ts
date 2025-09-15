// app/api/stations/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();

    // Accept body as partial object with columns to update
    const updates = body;

    // Use StationId as primary key column name - adjust if your PK is 'stationid' or 'id'
    const pkColumn = 'StationId'; // change if different

    const { data, error } = await supabaseServer
      .from('Stations')
      .update(updates)
      .eq(pkColumn, id)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/stations/:id error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('PATCH handler error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
