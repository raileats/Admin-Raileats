// app/api/orders/complaints/route.ts

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
   SUPABASE SERVER CLIENT
   ========================================================= */

function supabaseServer() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    throw new Error(
      "Supabase server environment variables are missing"
    );
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(value: any) {
  const text =
    String(value ?? "").trim();

  return text || null;
}

function normalizeKey(value: any) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}

function normalizeRaisedByType(
  value: any
) {
  const key =
    normalizeKey(value);

  if (key === "customer") {
    return "Customer";
  }

  if (
    key === "restro" ||
    key === "restaurant" ||
    key === "vendor"
  ) {
    return "Restro";
  }

  if (key === "admin") {
    return "Admin";
  }

  return null;
}

function normalizeRequestedStatus(
  value: any
) {
  const raw =
    cleanText(value);

  if (!raw) {
    return null;
  }

  const aliases:
    Record<string, string> = {
      cancelled:
        "Cancelled",

      canceled:
        "Cancelled",

      notdelivered:
        "Not Delivered",

      delivered:
        "Delivered",

      baddelivery:
        "Bad Delivery",

      partialdelivery:
        "Partial Delivery",
    };

  return (
    aliases[
      normalizeKey(raw)
    ] || null
  );
}

function isFinalStatus(value: any) {
  return [
    "delivered",
    "cancelled",
    "canceled",
    "notdelivered",
    "baddelivery",
    "partialdelivery",
  ].includes(
    normalizeKey(value)
  );
}

function missingColumnName(
  message: string
) {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column "([^"]+)" does not exist/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      message.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

async function insertHistoryBestEffort(
  supabase: any,
  payload:
    Record<string, any>
) {
  let attempt = {
    ...payload,
  };

  for (
    let i = 0;
    i < 16;
    i += 1
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "OrderStatusHistory"
        )
        .insert(attempt)
        .select("*")
        .maybeSingle();

    if (!error) {
      return {
        data,
        error: null,
      };
    }

    const missing =
      missingColumnName(
        error.message || ""
      );

    if (
      !missing ||
      !(missing in attempt)
    ) {
      return {
        data: null,
        error,
      };
    }

    const nextAttempt = {
      ...attempt,
    };

    delete nextAttempt[
      missing
    ];

    attempt =
      nextAttempt;
  }

  return {
    data: null,
    error: {
      message:
        "Unable to insert complaint status history",
    },
  };
}

/* =========================================================
   GET COMPLAINTS
   ========================================================= */

export async function GET(
  req: NextRequest
) {
  try {
    const supabase =
      supabaseServer();

    const {
      searchParams,
    } =
      new URL(req.url);

    const complaintStatus =
      cleanText(
        searchParams.get(
          "complaintStatus"
        ) ??
        searchParams.get(
          "status"
        )
      );

    const orderId =
      cleanText(
        searchParams.get(
          "orderId"
        )
      );

    const restroCode =
      cleanText(
        searchParams.get(
          "restroCode"
        )
      );

    const raisedByType =
      normalizeRaisedByType(
        searchParams.get(
          "raisedByType"
        )
      );

    const search =
      cleanText(
        searchParams.get(
          "search"
        )
      );

    const requestedLimit =
      Number(
        searchParams.get(
          "limit"
        ) || 100
      );

    const limit =
      Number.isFinite(
        requestedLimit
      )
        ? Math.min(
            Math.max(
              Math.trunc(
                requestedLimit
              ),
              1
            ),
            500
          )
        : 100;

    let query =
      supabase
        .from(
          "OrderComplaints"
        )
        .select("*")
        .order(
          "CreatedAt",
          {
            ascending: false,
          }
        )
        .limit(limit);

    if (complaintStatus) {
      query =
        query.eq(
          "ComplaintStatus",
          complaintStatus
        );
    }

    if (orderId) {
      query =
        query.eq(
          "OrderId",
          orderId
        );
    }

    if (restroCode) {
      query =
        query.eq(
          "RestroCode",
          restroCode
        );
    }

    if (raisedByType) {
      query =
        query.eq(
          "RaisedByType",
          raisedByType
        );
    }

    if (search) {
      const safeSearch =
        search
          .replace(
            /[%(),]/g,
            " "
          )
          .trim();

      if (safeSearch) {
        query =
          query.or(
            [
              `ComplaintNo.ilike.%${safeSearch}%`,
              `OrderId.ilike.%${safeSearch}%`,
              `RestroName.ilike.%${safeSearch}%`,
              `CustomerName.ilike.%${safeSearch}%`,
              `CustomerMobile.ilike.%${safeSearch}%`,
              `RaisedByName.ilike.%${safeSearch}%`,
              `RaisedByMobile.ilike.%${safeSearch}%`,
              `RequestedSubStatus.ilike.%${safeSearch}%`,
              `ComplaintRemarks.ilike.%${safeSearch}%`,
            ].join(",")
          );
      }
    }

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error.message ||
            "Failed to load complaints",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      rows:
        data || [],
      count:
        data?.length || 0,
    });
  } catch (
    error: any
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST - RAISE COMPLAINT
   ========================================================= */

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req
        .json()
        .catch(
          () => ({})
        );

    const orderId =
      cleanText(
        body.OrderId ??
        body.orderId
      );

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Order id is required",
        },
        {
          status: 400,
        }
      );
    }

    const raisedByType =
      normalizeRaisedByType(
        body.RaisedByType ??
        body.raisedByType ??
        body.raisedBy
      );

    if (!raisedByType) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "RaisedByType must be Customer, Restro or Admin",
        },
        {
          status: 400,
        }
      );
    }

    const requestedStatus =
      normalizeRequestedStatus(
        body.RequestedStatus ??
        body.requestedStatus
      );

    if (!requestedStatus) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Requested status must be Cancelled, Not Delivered, Delivered, Bad Delivery or Partial Delivery",
        },
        {
          status: 400,
        }
      );
    }

    const requestedSubStatus =
      cleanText(
        body.RequestedSubStatus ??
        body.requestedSubStatus ??
        body.SubStatus ??
        body.subStatus
      );

    if (!requestedSubStatus) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Complaint sub status is required",
        },
        {
          status: 400,
        }
      );
    }

    const complaintRemarks =
      cleanText(
        body.ComplaintRemarks ??
        body.complaintRemarks ??
        body.Remarks ??
        body.remarks
      );

    const raisedByName =
      cleanText(
        body.RaisedByName ??
        body.raisedByName ??
        body.UserName ??
        body.userName
      );

    const raisedByMobile =
      cleanText(
        body.RaisedByMobile ??
        body.raisedByMobile ??
        body.Mobile ??
        body.mobile
      );

    const supabase =
      supabaseServer();

    const {
      data: order,
      error: orderError,
    } =
      await supabase
        .from("Orders")
        .select("*")
        .eq(
          "OrderId",
          orderId
        )
        .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            orderError.message ||
            "Failed to load order",
        },
        {
          status: 500,
        }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Order not found: ${orderId}`,
        },
        {
          status: 404,
        }
      );
    }

    const currentStatus =
      cleanText(
        order.Status
      ) || "Booked";

    const currentSubStatus =
      cleanText(
        order.SubStatus
      );

    if (
      normalizeKey(
        currentStatus
      ) === "complaints"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "A complaint is already pending for this order",
        },
        {
          status: 409,
        }
      );
    }

    if (
      isFinalStatus(
        currentStatus
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Complaint cannot be raised after order is ${currentStatus}`,
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: pendingComplaint,
      error: pendingError,
    } =
      await supabase
        .from(
          "OrderComplaints"
        )
        .select(
          "ComplaintId, ComplaintNo, ComplaintStatus"
        )
        .eq(
          "OrderId",
          orderId
        )
        .eq(
          "ComplaintStatus",
          "Pending"
        )
        .maybeSingle();

    if (pendingError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            pendingError.message ||
            "Unable to check pending complaint",
        },
        {
          status: 500,
        }
      );
    }

    if (pendingComplaint) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "A complaint is already pending for this order",
          complaint:
            pendingComplaint,
        },
        {
          status: 409,
        }
      );
    }

    const changedAt =
      new Date()
        .toISOString();

    const complaintPayload = {
      OrderId:
        orderId,

      RestroCode:
        order.RestroCode,

      RestroName:
        cleanText(
          order.RestroName
        ),

      CustomerName:
        cleanText(
          order.CustomerName
        ),

      CustomerMobile:
        cleanText(
          order.CustomerMobile
        ),

      RaisedByType:
        raisedByType,

      RaisedByName:
        raisedByName,

      RaisedByMobile:
        raisedByMobile,

      PreviousStatus:
        currentStatus,

      PreviousSubStatus:
        currentSubStatus,

      RequestedStatus:
        requestedStatus,

      RequestedSubStatus:
        requestedSubStatus,

      ComplaintRemarks:
        complaintRemarks,

      ComplaintStatus:
        "Pending",
    };

    const {
      data: complaint,
      error: complaintError,
    } =
      await supabase
        .from(
          "OrderComplaints"
        )
        .insert(
          complaintPayload
        )
        .select("*")
        .maybeSingle();

    if (complaintError) {
      const duplicate =
        complaintError.code ===
          "23505";

      return NextResponse.json(
        {
          ok: false,
          error:
            duplicate
              ? "A complaint is already pending for this order"
              : (
                  complaintError.message ||
                  "Failed to create complaint"
                ),
        },
        {
          status:
            duplicate
              ? 409
              : 500,
        }
      );
    }

    const {
      data: updatedOrder,
      error: updateError,
    } =
      await supabase
        .from("Orders")
        .update({
          Status:
            "Complaints",

          SubStatus:
            requestedSubStatus,

          UpdatedAt:
            changedAt,
        })
        .eq(
          "OrderId",
          orderId
        )
        .select("*")
        .maybeSingle();

    if (
      updateError ||
      !updatedOrder
    ) {
      if (complaint?.ComplaintId) {
        await supabase
          .from(
            "OrderComplaints"
          )
          .delete()
          .eq(
            "ComplaintId",
            complaint.ComplaintId
          );
      }

      return NextResponse.json(
        {
          ok: false,
          error:
            updateError?.message ||
            "Failed to move order to Complaints",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: history,
      error: historyError,
    } =
      await insertHistoryBestEffort(
        supabase,
        {
          OrderId:
            orderId,

          OldStatus:
            currentStatus,

          PreviousStatus:
            currentStatus,

          NewStatus:
            "Complaints",

          Status:
            "Complaints",

          SubStatus:
            requestedSubStatus,

          Remarks:
            complaintRemarks,

          Note:
            complaintRemarks ??
            requestedSubStatus,

          ChangedBy:
            raisedByName ??
            raisedByType,

          UserType:
            raisedByType,

          UserName:
            raisedByName ??
            raisedByType,

          ActionSource:
            raisedByType,

          OrderPenalty:
            order.OrderPenalty ??
            0,

          ChangedAt:
            changedAt,

          CreatedAt:
            changedAt,
        }
      );

    return NextResponse.json(
      {
        ok: true,
        message:
          "Complaint raised successfully",

        complaint,
        order:
          updatedOrder,

        history,

        historyWarning:
          historyError
            ?.message ||
          null,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: any
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
