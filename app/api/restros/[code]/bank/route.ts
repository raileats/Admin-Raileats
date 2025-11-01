// app/api/restros/[code]/bank/route.ts
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
    const codeKeys = codeNum !== null ? [codeStr, String(codeNum)] : [codeStr];

    const body = await req.json();
    const form = {
      account_holder_name: (body.account_holder_name ?? "").trim(),
      account_number: (body.account_number ?? "").trim(),
      ifsc_code: (body.ifsc_code ?? "").trim(),
      bank_name: (body.bank_name ?? "").trim(),
      branch: (body.branch ?? "").trim(),
      status: ((body.status ?? "active") as BankStatus),
    };

    // 1) पुराना master snapshot (UPDATE से पहले)
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

    // string key
    const { data: mStr, error: mStrErr } = await supabase
      .from(masterTable)
      .select(
        "AccountHolderName, AccountNumber, BankName, IFSCCode, Branch, BankStatus, BankDetailsCreatedDate"
      )
      .eq("RestroCode", codeStr)
      .maybeSingle();
    if (mStrErr) throw mStrErr;
    if (mStr) oldSnap = mStr;

    // numeric key fallback
    if (!oldSnap && codeNum !== null) {
      const { data: mNum, error: mNumErr } = await supabase
        .from(masterTable)
        .select(
          "AccountHolderName, AccountNumber, BankName, IFSCCode, Branch, BankStatus, BankDetailsCreatedDate"
        )
        .eq("RestroCode", codeNum)
        .maybeSingle();
      if (mNumErr) throw mNumErr;
      if (mNum) oldSnap = mNum;
    }

    // 2) Master replace
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

    // 3) History: सभी पुरानी rows inactive
    {
      const { error } = await supabase
        .from(historyTable)
        .update({ status: "inactive" as BankStatus })
        .in("restro_code", codeKeys);
      if (error) throw error;
    }

    // 4) हमेशा पुराना snapshot INSERT करो (अगर कोई meaningful वैल्यू है)
    const anyOld =
      oldSnap &&
      !!(
        oldSnap.AccountHolderName ||
        oldSnap.AccountNumber ||
        oldSnap.BankName ||
        oldSnap.IFSCCode ||
        oldSnap.Branch
      );

    if (anyOld) {
      const { error } = await supabase.from(historyTable).insert({
        restro_code: codeStr, // normalize as string
        account_holder_name: oldSnap?.AccountHolderName ?? "",
        account_number: oldSnap?.AccountNumber ?? "",
        ifsc_code: oldSnap?.IFSCCode ?? "",
        bank_name: oldSnap?.BankName ?? "",
        branch: oldSnap?.Branch ?? "",
        status: "inactive" as BankStatus,
      });
      if (error) throw error;
    }

    // 5) नया snapshot active INSERT
    {
      const { error } = await supabase.from(historyTable).insert({
        restro_code: codeStr,
        account_holder_name: form.account_holder_name || "",
        account_number: form.account_number || "",
        ifsc_code: form.ifsc_code || "",
        bank_name: form.bank_name || "",
        branch: form.branch || "",
        status: "active" as BankStatus,
      });
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("bank save api error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}
