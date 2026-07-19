// app/api/orders/complaints/[complaintId]/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  PATCH as updateOrderStatus,
} from "../../[orderId]/status/route";

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

function normalizeDecision(
  value: any
) {
  const key =
    normalizeKey(value);

  if (
    key === "approve" ||
    key === "approved"
  ) {
    return "Approved";
  }

  if (
    key === "reject" ||
    key === "rejected"
  ) {
    return "Rejected";
  }

  return null;
}

function normalizeFinalStatus(
  value: any
) {
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
      normalizeKey(value)
    ] || null
  );
}

function normalizePenalty(
  value: any
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue =
    Number(
      String(value)
        .replace(
          /[^\d.-]/g,
          ""
        )
    );

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    numericValue
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
        "Unable to insert complaint decision history",
    },
  };
}

async function readResponseJson(
  response: Response
) {
  return response
    .json()
    .catch(
      () => ({})
    );
}

/* =========================================================
   GET SINGLE COMPLAINT
   ========================================================= */

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      complaintId?: string;
      id?: string;
    };
  }
) {
  try {
    const complaintId =
      decodeURIComponent(
        String(
          params.complaintId ??
          params.id ??
          ""
        )
      ).trim();

    if (!complaintId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Complaint id is required",
        },
        {
          status: 400,
        }
      );
    }

    const numericId =
      Number(
        complaintId
      );

    const supabase =
      supabaseServer();

    let query =
      supabase
        .from(
          "OrderComplaints"
        )
        .select("*");

    query =
      Number.isFinite(
        numericId
      )
        ? query.eq(
            "ComplaintId",
            numericId
          )
        : query.eq(
            "ComplaintNo",
            complaintId
          );

    const {
      data,
      error,
    } =
      await query
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error.message ||
            "Failed to load complaint",
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
            "Complaint not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      complaint:
        data,
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
   PATCH - APPROVE / REJECT COMPLAINT
   ========================================================= */

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      complaintId?: string;
      id?: string;
    };
  }
) {
  try {
    const complaintId =
      decodeURIComponent(
        String(
          params.complaintId ??
          params.id ??
          ""
        )
      ).trim();

    if (!complaintId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Complaint id is required",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req
        .json()
        .catch(
          () => ({})
        );

    const decision =
      normalizeDecision(
        body.decision ??
        body.Decision ??
        body.action ??
        body.Action ??
        body.complaintStatus ??
        body.ComplaintStatus
      );

    if (!decision) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Decision must be Approve or Reject",
        },
        {
          status: 400,
        }
      );
    }

    const adminName =
      cleanText(
        body.adminName ??
        body.AdminName ??
        body.userName ??
        body.UserName ??
        body.changedBy ??
        body.ChangedBy
      ) || "Admin";

    const adminRemarks =
      cleanText(
        body.adminRemarks ??
        body.AdminRemarks ??
        body.remarks ??
        body.Remarks
      );

    const supabase =
      supabaseServer();

    const numericId =
      Number(
        complaintId
      );

    let complaintQuery =
      supabase
        .from(
          "OrderComplaints"
        )
        .select("*");

    complaintQuery =
      Number.isFinite(
        numericId
      )
        ? complaintQuery.eq(
            "ComplaintId",
            numericId
          )
        : complaintQuery.eq(
            "ComplaintNo",
            complaintId
          );

    const {
      data: complaint,
      error: complaintError,
    } =
      await complaintQuery
        .maybeSingle();

    if (complaintError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            complaintError.message ||
            "Failed to load complaint",
        },
        {
          status: 500,
        }
      );
    }

    if (!complaint) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Complaint not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      complaint.ComplaintStatus !==
      "Pending"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Complaint is already ${complaint.ComplaintStatus}`,
          complaint,
        },
        {
          status: 409,
        }
      );
    }

    const orderId =
      cleanText(
        complaint.OrderId
      );

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Complaint order id is missing",
        },
        {
          status: 500,
        }
      );
    }

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

    const changedAt =
      new Date()
        .toISOString();

    /* =====================================================
       REJECT
       ===================================================== */

    if (
      decision === "Rejected"
    ) {
      const previousStatus =
        cleanText(
          complaint.PreviousStatus
        ) || "Booked";

      const previousSubStatus =
        cleanText(
          complaint.PreviousSubStatus
        );

      const {
        data: rejectedComplaint,
        error: rejectError,
      } =
        await supabase
          .from(
            "OrderComplaints"
          )
          .update({
            ComplaintStatus:
              "Rejected",

            AdminRemarks:
              adminRemarks,

            FinalStatus:
              null,

            FinalSubStatus:
              null,

            ApprovedBy:
              null,

            ApprovedAt:
              null,

            RejectedBy:
              adminName,

            RejectedAt:
              changedAt,
          })
          .eq(
            "ComplaintId",
            complaint.ComplaintId
          )
          .eq(
            "ComplaintStatus",
            "Pending"
          )
          .select("*")
          .maybeSingle();

      if (
        rejectError ||
        !rejectedComplaint
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              rejectError?.message ||
              "Unable to reject complaint",
          },
          {
            status: 500,
          }
        );
      }

      const {
        data: restoredOrder,
        error: restoreError,
      } =
        await supabase
          .from("Orders")
          .update({
            Status:
              previousStatus,

            SubStatus:
              previousSubStatus,

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
        restoreError ||
        !restoredOrder
      ) {
        await supabase
          .from(
            "OrderComplaints"
          )
          .update({
            ComplaintStatus:
              "Pending",

            AdminRemarks:
              null,

            RejectedBy:
              null,

            RejectedAt:
              null,
          })
          .eq(
            "ComplaintId",
            complaint.ComplaintId
          );

        return NextResponse.json(
          {
            ok: false,
            error:
              restoreError?.message ||
              "Complaint was not rejected because order could not be restored",
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
              cleanText(
                order.Status
              ) || "Complaints",

            PreviousStatus:
              cleanText(
                order.Status
              ) || "Complaints",

            NewStatus:
              previousStatus,

            Status:
              previousStatus,

            SubStatus:
              previousSubStatus,

            Remarks:
              adminRemarks,

            Note:
              adminRemarks ??
              "Complaint Rejected",

            ChangedBy:
              adminName,

            UserType:
              "Admin",

            UserName:
              adminName,

            ActionSource:
              "Complaint Rejected",

            OrderPenalty:
              order.OrderPenalty ??
              0,

            ChangedAt:
              changedAt,

            CreatedAt:
              changedAt,
          }
        );

      return NextResponse.json({
        ok: true,
        decision:
          "Rejected",

        message:
          "Complaint rejected and order restored",

        complaint:
          rejectedComplaint,

        order:
          restoredOrder,

        history,

        historyWarning:
          historyError
            ?.message ||
          null,
      });
    }

    /* =====================================================
       APPROVE
       ===================================================== */

    const finalStatus =
      normalizeFinalStatus(
        body.finalStatus ??
        body.FinalStatus ??
        complaint.RequestedStatus
      );

    if (!finalStatus) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Final status must be Cancelled, Not Delivered, Delivered, Bad Delivery or Partial Delivery",
        },
        {
          status: 400,
        }
      );
    }

    const finalSubStatus =
      cleanText(
        body.finalSubStatus ??
        body.FinalSubStatus ??
        body.subStatus ??
        body.SubStatus ??
        complaint.RequestedSubStatus
      );

    if (!finalSubStatus) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Final sub status is required",
        },
        {
          status: 400,
        }
      );
    }

    const requestedPenalty =
      normalizePenalty(
        body.orderPenalty ??
        body.OrderPenalty ??
        body.vendorPenalty ??
        body.VendorPenalty
      );

    const {
      data: reservedComplaint,
      error: reserveError,
    } =
      await supabase
        .from(
          "OrderComplaints"
        )
        .update({
          ComplaintStatus:
            "Approved",

          FinalStatus:
            finalStatus,

          FinalSubStatus:
            finalSubStatus,

          AdminRemarks:
            adminRemarks,

          ApprovedBy:
            adminName,

          ApprovedAt:
            changedAt,

          RejectedBy:
            null,

          RejectedAt:
            null,
        })
        .eq(
          "ComplaintId",
          complaint.ComplaintId
        )
        .eq(
          "ComplaintStatus",
          "Pending"
        )
        .select("*")
        .maybeSingle();

    if (
      reserveError ||
      !reservedComplaint
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            reserveError?.message ||
            "Unable to approve complaint",
        },
        {
          status: 500,
        }
      );
    }

    const statusUrl =
      new URL(
        `/api/orders/${encodeURIComponent(
          orderId
        )}/status`,
        req.url
      );

    const statusRequest =
      new NextRequest(
        statusUrl,
        {
          method:
            "PATCH",

          headers: {
            "content-type":
              "application/json",
          },

          body:
            JSON.stringify({
              newStatus:
                finalStatus,

              subStatus:
                finalSubStatus,

              remarks:
                adminRemarks ??
                complaint.ComplaintRemarks ??
                finalSubStatus,

              note:
                adminRemarks ??
                `Complaint ${complaint.ComplaintNo} Approved`,

              userType:
                "Admin",

              userName:
                adminName,

              actionSource:
                "Complaint Approved",

              ...(requestedPenalty !== null
                ? {
                    OrderPenalty:
                      requestedPenalty,
                  }
                : {}),
            }),
        }
      );

    const statusResponse =
      await updateOrderStatus(
        statusRequest,
        {
          params: {
            orderId,
          },
        }
      );

    const statusBody =
      await readResponseJson(
        statusResponse
      );

    if (
      !statusResponse.ok ||
      statusBody?.ok === false
    ) {
      await supabase
        .from(
          "OrderComplaints"
        )
        .update({
          ComplaintStatus:
            "Pending",

          FinalStatus:
            null,

          FinalSubStatus:
            null,

          AdminRemarks:
            null,

          ApprovedBy:
            null,

          ApprovedAt:
            null,
        })
        .eq(
          "ComplaintId",
          complaint.ComplaintId
        );

      return NextResponse.json(
        {
          ok: false,
          error:
            statusBody?.error ||
            statusBody?.message ||
            "Complaint approval failed while marking the order",

          details:
            statusBody,
        },
        {
          status:
            statusResponse.status ||
            500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      decision:
        "Approved",

      message:
        "Complaint approved and order marked successfully",

      complaint:
        reservedComplaint,

      orderResult:
        statusBody,
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
