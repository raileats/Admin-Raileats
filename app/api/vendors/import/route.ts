// app/api/vendors/import/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const vendors = body.vendors;
    if(!Array.isArray(vendors) || vendors.length===0) {
      return NextResponse.json({ error: "No vendors provided" }, { status: 400 });
    }

    // Normalize minimal fields (server-side safety)
    const rows = vendors.map(v => ({
      outlet_id: v.outlet_id,
      outlet_name: v.outlet_name,
      station_code: v.station_code,
      station_name: v.station_name,
      owner_name: v.owner_name,
      owner_mobile: v.owner_mobile,
      outlet_phone: v.outlet_phone || null,
      fssai_no: v.fssai_no || null,
      gst_no: v.gst_no || null,
      pan_no: v.pan_no || null,
      latitude: v.latitude || null,
      longitude: v.longitude || null,
      min_order_value: v.min_order_value || 0,
      delivery_charges: v.delivery_charges || 0,
      start_time: v.start_time || null,
      end_time: v.end_time || null,
      status: v.status || 'inactive',
      metadata: v.raw ? JSON.stringify(v.raw) : null
    }));

    // Upsert into vendors table on outlet_id
    const { data, error } = await supabase
      .from('vendors')
      .upsert(rows, { onConflict: 'outlet_id' });

    if(error) {
      console.error('upsert err', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inserted: data?.length ?? 0 }, { status: 200 });

  } catch(err:any){
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
