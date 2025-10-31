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

    // ---------- read current master snapshot (BEFORE update) ----------
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

    // try string first
    const { data: masterRowStr, error: readStrErr } = await supabase
      .from(masterTable)
      .select(
        "AccountHolderName, AccountNumber, BankName, IFSCCode, Branch, BankStatus, BankDetailsCreatedDate"
      )
      .eq("RestroCode", codeStr)
      .maybeSingle();
    if (readStrErr) throw readStrErr;

    if (masterRowStr) {
      oldSnap = masterRowStr;
    } else if (codeNum !== null) {
      const { data: masterRowNum, error: readNumErr } = await supabase
        .from(masterTable)
        .select(
          "AccountHolderName, AccountNumber, BankName, IFSCCode, Branch, BankStatus, BankDetailsCreatedDate"
        )
        .eq("RestroCode", codeNum)
        .maybeSingle();
      if (readNumErr) throw readNumErr;
      if (masterRowNum) oldSnap = masterRowNum;
    }

    // ---------- update master (replace to newest) ----------
    const masterPayload = {
      AccountHolderName: form.account_holder_name || null,
      AccountNumber: form.account_number || null,
      BankName: form.bank_name || null,
      IFSCCode: form.ifsc_code || null,
      Branch: form.branch || null,
      BankStatus: form.status === "active" ? "Active" : "Inactive",
      BankDetailsCreatedDate: new Date().toISOString(),
    };

    // try string eq
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

    // try numeric eq if needed
    if (updatedCount === 0 && codeNum !== null) {
      const { data, error } = await supabase
        .from(masterTable)
        .update(masterPayload)
        .eq("RestroCode", codeNum)
        .select("RestroCode");
      if (error) throw error;
      updatedCount = data?.length ?? 0;
    }

    // upsert if still nothing (keeps data consistent even for fresh code)
    if (updatedCount === 0) {
      const upsertPayload = { RestroCode: codeStr, ...masterPayload };
      const { error } = await supabase
        .from(masterTable)
        .upsert(upsertPayload, { onConflict: "RestroCode" });
      if (error) throw error;
    }

    // ---------- history handling ----------
    // get existing history count for this code (string/number)
    const { count: histCount, error: histCntErr } = await supabase
      .from(historyTable)
      .select("id", { count: "exact", head: true })
      .in("restro_code", codeKeys);
    if (histCntErr) throw histCntErr;

    // fetch latest history row (to avoid duplicating the same snapshot)
    const { data: latestHist, error: latestErr } = await supabase
      .from(historyTable)
      .select(
        "id, account_holder_name, account_number, ifsc_code, bank_name, branch, status"
      )
      .in("restro_code", codeKeys)
      .order("created_at", { ascending: false })
      .limit(1);
    if (latestErr) throw latestErr;

    // mark ALL old rows inactive for this code (string/num)
    const { error: inactErr } = await supabase
      .from(historyTable)
      .update({ status: "inactive" as BankStatus })
      .in("restro_code", codeKeys);
    if (inactErr) throw inactErr;

    const anyOld =
      oldSnap &&
      !!(
        oldSnap.AccountHolderName ||
        oldSnap.AccountNumber ||
        oldSnap.BankName ||
        oldSnap.IFSCCode ||
        oldSnap.Branch
      );

    // should we insert the old master snapshot as an inactive record?
    // rule:
    //  - if no history existed -> insert it
    //  - if history existed but the latest history row is NOT the same as old master -> insert it
    const latest = latestHist?.[0];
    const latestMatchesOld =
      latest &&
      latest.account_holder_name === (oldSnap?.AccountHolderName ?? "") &&
      latest.account_number === (oldSnap?.AccountNumber ?? "") &&
      latest.ifsc_code === (oldSnap?.IFSCCode ?? "") &&
      latest.bank_name === (oldSnap?.BankName ?? "") &&
      latest.branch === (oldSnap?.Branch ?? "");

    if (anyOld && ((histCount ?? 0) === 0 || !latestMatchesOld)) {
      const { error: oldInsErr } = await supabase.from(historyTable).insert({
        restro_code: codeStr, // normalize to string for all new rows
        account_holder_name: oldSnap?.AccountHolderName ?? "",
        account_number: oldSnap?.AccountNumber ?? "",
        ifsc_code: oldSnap?.IFSCCode ?? "",
        bank_name: oldSnap?.BankName ?? "",
        branch: oldSnap?.Branch ?? "",
        status: "inactive" as BankStatus,
      });
      if (oldInsErr) throw oldInsErr;
    }

    // insert the new active entry (top)
    const { error: newInsErr } = await supabase.from(historyTable).insert({
      restro_code: codeStr, // always string going forward
      account_holder_name: form.account_holder_name || "",
      account_number: form.account_number || "",
      ifsc_code: form.ifsc_code || "",
      bank_name: form.bank_name || "",
      branch: form.branch || "",
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
