// app/api/restros/[code]/credit-debit-note/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

/* =========================================================
   SUPABASE SERVICE CLIENT
   ========================================================= */

const supabase = createClient(
  process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(value: unknown) {
  const text =
    String(value ?? "").trim();

  return text || null;
}

function cleanAmount(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(
    String(value)
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "")
  );

  if (
    !Number.isFinite(parsed)
  ) {
    return null;
  }

  return (
    Math.round(
      Math.abs(parsed) * 100
    ) / 100
  );
}

function normalizeNoteType(
  value: unknown
) {
  const key =
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        ""
      );

  if (
    key === "credit" ||
    key === "creditnote"
  ) {
    return "CreditNote";
  }

  if (
    key === "debit" ||
    key === "debitnote"
  ) {
    return "DebitNote";
  }

  return null;
}

function rpcErrorMessage(
  error: any
) {
  return [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(" | ");
}

/* =========================================================
   GET

   Current restaurant balance aur recent Credit/Debit Notes
   load karne ke liye.
   ========================================================= */

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      code: string;
    };
  }
) {
  try {
    const restroCode =
      Number(params.code);

    if (
      !restroCode ||
      !Number.isFinite(
        restroCode
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid RestroCode",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       RESTAURANT DETAILS
       ===================================================== */

    const {
      data: restro,
      error: restroError,
    } =
      await supabase
        .from("RestroMaster")
        .select(
          `
          RestroCode,
          RestroName,
          StationCode,
          StationName
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .maybeSingle();

    if (restroError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            restroError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!restro) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Restaurant not found",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       LATEST BALANCE
       ===================================================== */

    const {
      data: lastRdsRow,
      error: balanceError,
    } =
      await supabase
        .from("RestroRDS")
        .select(
          `
          RDSId,
          CurrentBal,
          CreatedAt
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .order(
          "RDSId",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (balanceError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            balanceError.message,
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       RECENT CREDIT / DEBIT NOTES
       ===================================================== */

    const {
      data: notes,
      error: notesError,
    } =
      await supabase
        .from("RestroRDS")
        .select(
          `
          RDSId,
          OrderId,
          EntrySource,
          Remarks,
          SettlementAmount,
          PreviousBal,
          CurrentBal,
          CreatedAt
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .in(
          "EntrySource",
          [
            "CreditNote",
            "DebitNote",
          ]
        )
        .order(
          "RDSId",
          {
            ascending: false,
          }
        )
        .limit(20);

    if (notesError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            notesError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      restro: {
        RestroCode:
          restro.RestroCode,

        RestroName:
          restro.RestroName,

        StationCode:
          restro.StationCode,

        StationName:
          restro.StationName,
      },

      currentBalance:
        Number(
          lastRdsRow?.CurrentBal ??
            0
        ),

      lastRdsAt:
        lastRdsRow?.CreatedAt ??
        null,

      notes:
        Array.isArray(notes)
          ? notes
          : [],
    });
  } catch (error: any) {
    console.error(
      "CREDIT DEBIT NOTE GET ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST

   Credit Note / Debit Note create karne ke liye.
   ========================================================= */

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      code: string;
    };
  }
) {
  try {
    /* =====================================================
       RESTRO CODE
       ===================================================== */

    const restroCode =
      Number(params.code);

    if (
      !restroCode ||
      !Number.isFinite(
        restroCode
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid RestroCode",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       BODY
       ===================================================== */

    const body =
      await req
        .json()
        .catch(
          () => ({})
        );

    const noteType =
      normalizeNoteType(
        body.noteType ??
        body.NoteType ??
        body.type ??
        body.Type ??
        body.entrySource ??
        body.EntrySource
      );

    const amount =
      cleanAmount(
        body.amount ??
        body.Amount ??
        body.noteAmount ??
        body.NoteAmount
      );

    const remarks =
      cleanText(
        body.remarks ??
        body.Remarks ??
        body.reason ??
        body.Reason ??
        body.note ??
        body.Note
      );

    /* =====================================================
       VALIDATION
       ===================================================== */

    if (!noteType) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Please select Credit Note or Debit Note",
        },
        {
          status: 400,
        }
      );
    }

    if (
      amount === null ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Amount must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VERIFY RESTAURANT
       ===================================================== */

    const {
      data: restro,
      error: restroError,
    } =
      await supabase
        .from("RestroMaster")
        .select(
          `
          RestroCode,
          RestroName,
          StationCode,
          StationName
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .maybeSingle();

    if (restroError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            restroError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!restro) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Restaurant not found",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       CALL SQL FUNCTION
       ===================================================== */

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "create_restro_rds_note",
        {
          p_restro_code:
            restroCode,

          p_note_type:
            noteType,

          p_amount:
            amount,

          p_remarks:
            remarks,
        }
      );

    if (error) {
      const message =
        rpcErrorMessage(
          error
        );

      console.error(
        "CREATE RESTRO RDS NOTE RPC ERROR =>",
        {
          restroCode,
          noteType,
          amount,
          error: message,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            message ||
            "Unable to create Credit/Debit Note",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Credit/Debit Note function returned an empty response",
        },
        {
          status: 500,
        }
      );
    }

    if (
      data?.ok === false
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            cleanText(
              data?.error
            ) ||
            "Unable to create Credit/Debit Note",

          data,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SUCCESS
       ===================================================== */

    return NextResponse.json(
      {
        ok: true,

        message:
          noteType ===
          "CreditNote"
            ? "Credit Note added successfully"
            : "Debit Note added successfully",

        restro: {
          RestroCode:
            restro.RestroCode,

          RestroName:
            restro.RestroName,

          StationCode:
            restro.StationCode,

          StationName:
            restro.StationName,
        },

        note: {
          rdsId:
            data?.rdsId ??
            null,

          referenceId:
            data?.referenceId ??
            null,

          entrySource:
            data?.entrySource ??
            noteType,

          amount:
            Number(
              data?.amount ??
                amount
            ),

          settlementAmount:
            Number(
              data?.settlementAmount ??
                0
            ),

          previousBalance:
            Number(
              data?.previousBalance ??
                0
            ),

          currentBalance:
            Number(
              data?.currentBalance ??
                0
            ),

          remarks:
            data?.remarks ??
            remarks ??
            null,
        },

        data,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "CREDIT DEBIT NOTE POST ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}
