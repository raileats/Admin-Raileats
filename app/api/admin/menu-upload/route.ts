// app/api/admin/menu-upload/route.ts
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanKey(key: any) {
  return String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function value(row: any, names: string[]) {
  const map: any = {};
  Object.keys(row || {}).forEach((k) => {
    map[cleanKey(k)] = row[k];
  });

  for (const name of names) {
    const found = map[cleanKey(name)];
    if (found !== undefined && found !== null && String(found).trim() !== "") return found;
  }

  return "";
}

function text(v: any) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function num(v: any) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function statusValue(v: any) {
  const s = text(v).toUpperCase();
  if (s === "OFF") return "OFF";
  if (s === "DELETED") return "DELETED";
  return "ON";
}

function excelTime(v: any) {
  if (v === undefined || v === null || String(v).trim() === "") return null;

  if (typeof v === "number") {
    const totalSeconds = Math.round(v * 24 * 60 * 60);
    const hh = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, "0");
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  const s = text(v);
  if (/^\d{1,2}:\d{2}$/.test(s)) return `${s}:00`;
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s;
  return s;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const restroCodeRaw = text(formData.get("restroCode"));
    const file = formData.get("file") as File | null;

    const restroCode = Number(restroCodeRaw);

    if (!restroCode || Number.isNaN(restroCode)) {
      return NextResponse.json({ ok: false, error: "Valid Restro Code required" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ ok: false, error: "Excel file required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json({ ok: false, error: "Excel sheet not found" }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const excelRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!excelRows.length) {
      return NextResponse.json({ ok: false, error: "Excel file is empty" }, { status: 400 });
    }

    const { data: existingRows, error: existingError } = await supabaseServer
      .from("RestroMenuItems")
      .select("*")
      .eq("restro_code", restroCode);

    if (existingError) {
      return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
    }

    const existingByItemCode = new Map<string, any>();
    const existingByItemName = new Map<string, any>();

    let maxItemCode = 0;

    (existingRows || []).forEach((r: any) => {
      const code = String(r.item_code ?? "").trim();
      const name = String(r.item_name ?? "").trim().toLowerCase();

      if (code) existingByItemCode.set(code, r);
      if (name) existingByItemName.set(name, r);

      const n = Number(r.item_code);
      if (Number.isFinite(n) && n > maxItemCode) maxItemCode = n;
    });

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i];
      const rowNo = i + 2;

      const itemName = text(value(row, ["item_name", "Item Name", "ItemName"]));

      if (!itemName) {
        errors.push(`Row ${rowNo}: item_name required`);
        continue;
      }

      let itemCode = text(value(row, ["item_code", "Item Code", "ItemCode"]));

      let existing: any = null;

      if (itemCode && existingByItemCode.has(itemCode)) {
        existing = existingByItemCode.get(itemCode);
      } else if (existingByItemName.has(itemName.toLowerCase())) {
        existing = existingByItemName.get(itemName.toLowerCase());
        itemCode = String(existing.item_code ?? "");
      }

      if (!itemCode) {
        maxItemCode += 1;
        itemCode = String(maxItemCode);
      }

      const basePrice = num(value(row, ["base_price", "Base Price", "BasePrice"]));
      const gstPercent = num(value(row, ["gst_percent", "GST %", "GST", "GST Percent", "GstPercent"]));
      let sellingPrice = num(value(row, ["selling_price", "Selling Price", "SellingPrice"]));

      if (sellingPrice === null && basePrice !== null && gstPercent !== null) {
        sellingPrice = Number((basePrice + (basePrice * gstPercent) / 100).toFixed(2));
      }

      const payload: any = {
        restro_code: restroCode,
        item_code: itemCode,
        item_name: itemName,
        item_description: text(value(row, ["item_description", "Item Description", "Description"])) || null,
        item_category: text(value(row, ["item_category", "Item Category", "Category"])) || null,
        item_cuisine: text(value(row, ["item_cuisine", "Item Cuisine", "Cuisine"])) || null,
        menu_type: text(value(row, ["menu_type", "Menu Type", "MenuType"])) || null,
        start_time: excelTime(value(row, ["start_time", "Start Time", "StartTime"])),
        end_time: excelTime(value(row, ["end_time", "End Time", "EndTime"])),
        restro_price: num(value(row, ["restro_price", "Restro Price", "RestroPrice"])),
        base_price: basePrice,
        gst_percent: gstPercent,
        selling_price: sellingPrice,
        status: statusValue(value(row, ["status", "Status"])),
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { error } = await supabaseServer
          .from("RestroMenuItems")
          .update(payload)
          .eq("id", existing.id);

        if (error) errors.push(`Row ${rowNo}: ${error.message}`);
        else updated++;
      } else {
        const { error } = await supabaseServer
          .from("RestroMenuItems")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });

        if (error) errors.push(`Row ${rowNo}: ${error.message}`);
        else inserted++;
      }
    }

    if (errors.length) {
      return NextResponse.json(
        {
          ok: false,
          error: errors.slice(0, 10).join(" | "),
          inserted,
          updated,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted,
      updated,
      message: `Menu upload successful. Inserted: ${inserted}, Updated: ${updated}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Menu upload failed" },
      { status: 500 }
    );
  }
}
