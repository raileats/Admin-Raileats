import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type BankStatus = "active" | "inactive";

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const historyTable = "RestroBank";
  const masterTable = "RestroMaster";

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Supabase service configuration missing" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const codeStr = String(params.code ?? "");
    const codeNum = /^\d+$/.test(codeStr) ? Number(codeStr) : null;
    const body = await req.json();

    const form = {
      account_holder_name: (body.account_holder_name ?? "").trim(),
      account_number: (body.account_number ?? "").trim(),
      ifsc_code: (body.ifsc_code ?? "").trim(),
      bank_name: (body.bank_name ?? "").trim(),
      branch: (body.branch ?? "").trim(),
      status: ((body.status ?? "active") as BankStatus),
    };

    // ---- 1) Read old snapshot from RestroMaster (BEFORE update)
    let oldSnap:
      | {
          AccountHolderName?: string | null;
          AccountNumber?: string | null;
          BankName?: string | null;
          IFSCCode?: string | null;
          Branch?: string | null;
          BankStatus?: any;
          BankDetailsCreatedDate?: string | null;
        }
      | null = null;

    const readOld = async (key: string | number) =>
      supabase
        .from(masterTable)
        .select(
          "AccountHolderName, AccountNumber, BankName, IFSCCode, Branch, BankStatus, BankDetailsCreatedDate"
        )
        .eq("RestroCode", key)
        .maybeSingle();

    // try string key first, then numeric key
    let { data: mStr, error: mStrErr } = await readOld(codeStr);
    if (mStrErr) throw mStrErr;
    if (mStr) oldSnap = mStr;
    if (!oldSnap && codeNum !== null) {
      const { data: mNum, error: mNumErr } = await readOld(codeNum);
      if (mNumErr) throw mNumErr;
      if (mNum) oldSnap = mNum;
    }

    const hasAnyOld =
      !!(
        oldSnap?.AccountHolderName ||
        oldSnap?.AccountNumber ||
        oldSnap?.IFSCCode ||
        oldSnap?.BankName ||
        oldSnap?.Branch
      );

    // ---- 2) Make all existing history rows inactive (for both string/num keys)
    // (करने से पहले भी safe है, बाद में भी; sequence को simple रखते हैं)
    const codeKeys = codeNum !== null ? [codeStr, String(codeNum)] : [codeStr];
    const { error: inactErr } = await supabase
      .from(historyTable)
      .update({ status: "inactive" as BankStatus })
      .in("restro_code", codeKeys);
    if (inactErr) throw inactErr;

    // ---- 3) Insert OLD snapshot as INACTIVE (always if there is any old value)
    if (hasAnyOld) {
      const { error: oldInsErr } = await supabase.from(historyTable).insert({
        restro_code: codeStr, // normalize to string
        account_holder_name: oldSnap?.AccountHolderName ?? "",
        account_number: oldSnap?.AccountNumber ?? "",
        ifsc_code: oldSnap?.IFSCCode ?? "",
        bank_name: oldSnap?.BankName ?? "",
        branch: oldSnap?.Branch ?? "",
        status: "inactive" as BankStatus,
      });
      if (oldInsErr) throw oldInsErr;
    }

    // ---- 4) Update/Upsert master to NEW payload
    const masterPayload = {
      AccountHolderName: form.account_holder_name || null,
      AccountNumber: form.account_number || null,
      BankName: form.bank_name || null,
      IFSCCode: form.ifsc_code || null,
      Branch: form.branch || null,
      BankStatus: form.status === "active" ? "Active" : "Inactive",
      BankDetailsCreatedDate: new Date().toISOString(),
    };

    let updatedCount = 0;
    {
      const { data, error } = await supabase
        .from(masterTable)
        .update(masterPayload)
        .eq("RestroCode", codeStr)
        .select("RestroCode");
      if (error) throw error;
      updatedCount = data?.length ?? 0;
    }
    if (updatedCount === 0 && codeNum !== null) {
      const { data, error } = await supabase
        .from(masterTable)
        .update(masterPayload)
        .eq("RestroCode", codeNum)
        .select("RestroCode");
      if (error) throw error;
      updatedCount = data?.length ?? 0;
    }
    if (updatedCount === 0) {
      const upsertPayload = { RestroCode: codeStr, ...masterPayload };
      const { error } = await supabase
        .from(masterTable)
        .upsert(upsertPayload, { onConflict: "RestroCode" });
      if (error) throw error;
    }

    // ---- 5) Insert NEW active snapshot to history
    const { error: newInsErr } = await supabase.from(historyTable).insert({
      restro_code: codeStr, // always string
      account_holder_name: form.account_holder_name,
      account_number: form.account_number,
      ifsc_code: form.ifsc_code,
      bank_name: form.bank_name,
      branch: form.branch,
      status: "active" as BankStatus,
    });
    if (newInsErr) throw newInsErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("bank save api error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}
