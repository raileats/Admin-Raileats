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

import {
  updateOrderJourneySafe,
  type OrderJourneyStage,
} from "@/lib/orderJourney";

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

type ComplaintLookupResult = {
  complaint: Record<string, any> | null;
  resolvedOrderId: string | null;
};

function isPrimaryComplaintId(
  value: string | null
) {
  return Boolean(
    value && /^\d+$/.test(value)
  );
}

function resolveJourneyStage(
  status: any,
  subStatus: any
): OrderJourneyStage {
  const subStatusKey =
    normalizeKey(subStatus);

  if (
    subStatusKey ===
    "baddelivery"
  ) {
    return "Bad Delivery";
  }

  if (
    subStatusKey ===
    "partialdelivery"
  ) {
    return "Partial Delivery";
  }

  const byStatus:
    Record<string, OrderJourneyStage> = {
      booked: "Booked",
      inverification:
        "In Verification",
      cancellationrequest:
        "Cancellation Request",
      neworder: "New Order",
      inkitchen: "In Kitchen",
      outfordelivery:
        "Out for Delivery",
      restromarkeddelivered:
        "Restro Marked Delivered",
      complaints: "Complaints",
      delivered: "Delivered",
      cancelled: "Cancelled",
      notdelivered:
        "Not Delivered",
      baddelivery:
        "Bad Delivery",
      partialdelivery:
        "Partial Delivery",
      refund: "Refund",
    };

  return (
    byStatus[
      normalizeKey(status)
    ] || "Booked"
  );
}

function isMissingComplaintNoColumn(
  error: any
) {
  const message = String(
    error?.message ?? ""
  ).toLowerCase();

  return (
    error?.code === "42703" ||
    error?.code === "PGRST204"
  ) && message.includes(
    "complaintno"
  );
}

async function findComplaintBy(
  supabase: any,
  column:
    | "ComplaintId"
    | "ComplaintNo"
    | "OrderId",
  value: string | null
) {
  if (!value) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("OrderComplaints")
    .select("*")
    .eq(column, value)
    .order("CreatedAt", {
      ascending: false,
    })
    .limit(20);

  if (error) {
    if (
      column === "ComplaintNo" &&
      isMissingComplaintNoColumn(
        error
      )
    ) {
      return null;
    }

    throw error;
  }

  const rows = Array.isArray(data)
    ? data
    : [];

  return (
    rows.find(
      (row: any) =>
        row.ComplaintStatus ===
        "Pending"
    ) ||
    rows[0] ||
    null
  );
}

async function resolveComplaint(
  supabase: any,
  {
    routeIdentifier,
    bodyComplaintId,
    bodyOrderId,
  }: {
    routeIdentifier: string | null;
    bodyComplaintId: string | null;
    bodyOrderId: string | null;
  }
): Promise<ComplaintLookupResult> {
  const attempts: Array<{
    column:
      | "ComplaintId"
      | "ComplaintNo"
      | "OrderId";
    value: string | null;
  }> = [];

  if (
    isPrimaryComplaintId(
      bodyComplaintId
    )
  ) {
    attempts.push({
      column: "ComplaintId",
      value: bodyComplaintId,
    });
  }

  if (
    isPrimaryComplaintId(
      routeIdentifier
    )
  ) {
    attempts.push({
      column: "ComplaintId",
      value: routeIdentifier,
    });
  }

  attempts.push(
    {
      column: "ComplaintNo",
      value: routeIdentifier,
    },
    {
      column: "OrderId",
      value: bodyOrderId,
    },
    {
      column: "OrderId",
      value: routeIdentifier,
    }
  );

  const seen = new Set<string>();

  for (const attempt of attempts) {
    if (!attempt.value) {
      continue;
    }

    const key =
      `${attempt.column}:${attempt.value}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    const complaint =
      await findComplaintBy(
        supabase,
        attempt.column,
        attempt.value
      );

    if (complaint) {
      return {
        complaint,
        resolvedOrderId:
          cleanText(
            complaint.OrderId
          ) || bodyOrderId,
      };
    }
  }

  return {
    complaint: null,
    resolvedOrderId:
      bodyOrderId || null,
  };
}

async function findOrderByCandidates(
  supabase: any,
  candidates:
    Array<string | null>
) {
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const orderId =
      cleanText(candidate);

    if (
      !orderId ||
      seen.has(orderId)
    ) {
      continue;
    }

    seen.add(orderId);

    const {
      data,
      error,
    } = await supabase
      .from("Orders")
      .select("*")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }
  }

  return null;
}

async function resolveLegacyPreviousState(
  supabase: any,
  orderId: string
): Promise<{
  status: OrderJourneyStage;
  subStatus: string | null;
}> {
  const {
    data: journey,
    error,
  } = await supabase
    .from("OrderJourney")
    .select("*")
    .eq("OrderId", orderId)
    .maybeSingle();

  if (error) {
    console.error(
      "Legacy complaint journey lookup warning",
      error
    );
  }

  const candidates: Array<{
    prefix: string;
    status: OrderJourneyStage;
    subStatus: string | null;
  }> = [
    {
      prefix: "PartialDelivery",
      status: "Delivered",
      subStatus: "Partial Delivery",
    },
    {
      prefix: "BadDelivery",
      status: "Delivered",
      subStatus: "Bad Delivery",
    },
    {
      prefix: "Delivered",
      status: "Delivered",
      subStatus: "Delivered",
    },
    {
      prefix: "NotDelivered",
      status: "Not Delivered",
      subStatus: null,
    },
    {
      prefix: "Cancelled",
      status: "Cancelled",
      subStatus: null,
    },
    {
      prefix: "RestroMarkedDelivered",
      status: "Restro Marked Delivered",
      subStatus: null,
    },
    {
      prefix: "OutForDelivery",
      status: "Out for Delivery",
      subStatus: null,
    },
    {
      prefix: "InKitchen",
      status: "In Kitchen",
      subStatus: null,
    },
    {
      prefix: "NewOrder",
      status: "New Order",
      subStatus: null,
    },
    {
      prefix: "InVerification",
      status: "In Verification",
      subStatus: null,
    },
    {
      prefix: "Booked",
      status: "Booked",
      subStatus: null,
    },
  ];

  for (const candidate of candidates) {
    if (
      journey &&
      [
        journey[`${candidate.prefix}Update`],
        journey[`${candidate.prefix}ActionAtDate`],
        journey[`${candidate.prefix}ActionAtTime`],
      ].some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
      )
    ) {
      return {
        status: candidate.status,
        subStatus:
          candidate.subStatus,
      };
    }
  }

  return {
    status: "Booked",
    subStatus: null,
  };
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
    const routeIdentifier =
      decodeURIComponent(
        String(
          params.complaintId ??
          params.id ??
          ""
        )
      ).trim();

    if (!routeIdentifier) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Complaint id or OrderId is required",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      supabaseServer();

    const {
      complaint: data,
      resolvedOrderId,
    } = await resolveComplaint(
      supabase,
      {
        routeIdentifier:
          routeIdentifier,
        bodyComplaintId: null,
        bodyOrderId: null,
      }
    );

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "complaint_record_not_found",
          orderId:
            resolvedOrderId,
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
    const routeIdentifier =
      decodeURIComponent(
        String(
          params.complaintId ??
          params.id ??
          ""
        )
      ).trim();

    const body =
      await req
        .json()
        .catch(
          () => ({})
        );

    const bodyComplaintId =
      cleanText(
        body.complaintId ??
        body.ComplaintId
      );

    const bodyOrderId =
      cleanText(
        body.orderId ??
        body.OrderId
      );

    if (
      !routeIdentifier &&
      !bodyComplaintId &&
      !bodyOrderId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Order ID not found",
        },
        {
          status: 400,
        }
      );
    }

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

    const {
      complaint,
      resolvedOrderId:
        lookupOrderId,
    } = await resolveComplaint(
      supabase,
      {
        routeIdentifier,
        bodyComplaintId,
        bodyOrderId,
      }
    );

    if (!complaint) {
      const legacyOrder =
        await findOrderByCandidates(
          supabase,
          [
            lookupOrderId,
            bodyOrderId,
            routeIdentifier,
          ]
        );

      const legacyOrderId =
        cleanText(
          legacyOrder?.OrderId
        ) ||
        lookupOrderId ||
        bodyOrderId;

      if (!legacyOrder) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "complaint_record_not_found",
            orderId:
              legacyOrderId || null,
          },
          {
            status: 404,
          }
        );
      }

      if (
        normalizeKey(
          legacyOrder.Status
        ) !== "complaints"
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "complaint_already_completed",
            orderId:
              legacyOrderId,
            order:
              legacyOrder,
          },
          {
            status: 409,
          }
        );
      }

      const changedAt =
        new Date()
          .toISOString();

      if (
        decision === "Rejected"
      ) {
        const previous =
          await resolveLegacyPreviousState(
            supabase,
            String(
              legacyOrderId
            )
          );

        const {
          data: restoredOrder,
          error: restoreError,
        } = await supabase
          .from("Orders")
          .update({
            Status:
              previous.status,
            SubStatus:
              previous.subStatus,
            UpdatedAt:
              changedAt,
          })
          .eq(
            "OrderId",
            legacyOrderId
          )
          .eq(
            "Status",
            legacyOrder.Status
          )
          .select("*")
          .maybeSingle();

        if (
          restoreError ||
          !restoredOrder
        ) {
          return NextResponse.json(
            {
              ok: false,
              error:
                restoreError
                  ?.message ||
                "complaint_concurrent_update",
              orderId:
                legacyOrderId,
            },
            {
              status:
                restoreError
                  ? 500
                  : 409,
            }
          );
        }

        const journey =
          await updateOrderJourneySafe({
            supabase,
            orderId:
              String(
                legacyOrderId
              ),
            stage:
              previous.status,
            status:
              previous.status,
            subStatus:
              previous.subStatus,
            remarks:
              adminRemarks ||
              "Complaint Rejected",
            userType: "Admin",
            userName:
              adminName,
            source:
              "Complaint Rejected",
            actionAt:
              changedAt,
            order: {
              restroCode:
                legacyOrder.RestroCode,
              restroName:
                legacyOrder.RestroName,
              stationCode:
                legacyOrder.StationCode,
              stationName:
                legacyOrder.StationName,
              deliveryDate:
                legacyOrder.DeliveryDate,
              deliveryTime:
                legacyOrder.DeliveryTime,
            },
          });

        const {
          data: history,
          error: historyError,
        } = await insertHistoryBestEffort(
          supabase,
          {
            OrderId:
              legacyOrderId,
            OldStatus:
              legacyOrder.Status,
            PreviousStatus:
              legacyOrder.Status,
            NewStatus:
              previous.status,
            Status:
              previous.status,
            SubStatus:
              previous.subStatus,
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
              legacyOrder.OrderPenalty ??
              0,
            ChangedAt:
              changedAt,
            CreatedAt:
              changedAt,
          }
        );

        return NextResponse.json({
          ok: true,
          complaintId: null,
          orderId:
            legacyOrderId,
          decision:
            "Rejected",
          finalStatus:
            previous.status,
          finalSubStatus:
            previous.subStatus,
          legacyComplaint: true,
          order:
            restoredOrder,
          history,
          journey,
          historyWarning:
            historyError
              ?.message ||
            null,
        });
      }

      const legacyFinalStatus =
        normalizeFinalStatus(
          body.finalStatus ??
          body.FinalStatus
        );

      if (!legacyFinalStatus) {
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

      const legacyFinalSubStatus =
        cleanText(
          body.finalSubStatus ??
          body.FinalSubStatus ??
          body.subStatus ??
          body.SubStatus
        );

      if (!legacyFinalSubStatus) {
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

      const legacyPenalty =
        normalizePenalty(
          body.orderPenalty ??
          body.OrderPenalty ??
          body.vendorPenalty ??
          body.VendorPenalty
        );

      const statusUrl =
        new URL(
          `/api/orders/${encodeURIComponent(
            String(
              legacyOrderId
            )
          )}/status`,
          req.url
        );

      const statusRequest =
        new NextRequest(
          statusUrl,
          {
            method: "PATCH",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify({
                newStatus:
                  legacyFinalStatus,
                subStatus:
                  legacyFinalSubStatus,
                remarks:
                  adminRemarks ??
                  legacyFinalSubStatus,
                note:
                  adminRemarks ??
                  "Legacy complaint approved",
                userType:
                  "Admin",
                userName:
                  adminName,
                actionSource:
                  "Complaint Approved",
                ...(legacyPenalty !==
                null
                  ? {
                      OrderPenalty:
                        legacyPenalty,
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
              orderId:
                String(
                  legacyOrderId
                ),
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

      const updatedOrder =
        statusBody?.row ??
        statusBody?.order ??
        await findOrderByCandidates(
          supabase,
          [legacyOrderId]
        );

      return NextResponse.json({
        ok: true,
        complaintId: null,
        orderId:
          legacyOrderId,
        decision:
          "Approved",
        finalStatus:
          legacyFinalStatus,
        finalSubStatus:
          legacyFinalSubStatus,
        legacyComplaint: true,
        order:
          updatedOrder,
        orderResult:
          statusBody,
      });
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

    if (
      normalizeKey(
        order.Status
      ) !== "complaints"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "complaint_already_completed",
          complaint,
          orderId,
          order,
        },
        {
          status: 409,
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
          .eq(
            "Status",
            order.Status
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

      const journey =
        await updateOrderJourneySafe({
          supabase,
          orderId,
          stage:
            resolveJourneyStage(
              previousStatus,
              previousSubStatus
            ),
          status:
            previousStatus,
          subStatus:
            previousSubStatus,
          remarks:
            adminRemarks ||
            "Complaint Rejected",
          userType: "Admin",
          userName:
            adminName,
          source:
            "Complaint Rejected",
          actionAt:
            changedAt,
          order: {
            restroCode:
              order.RestroCode,
            restroName:
              order.RestroName,
            stationCode:
              order.StationCode,
            stationName:
              order.StationName,
            deliveryDate:
              order.DeliveryDate,
            deliveryTime:
              order.DeliveryTime,
          },
        });

      return NextResponse.json({
        ok: true,
        complaintId:
          rejectedComplaint.ComplaintId ??
          null,
        orderId,
        decision:
          "Rejected",

        finalStatus:
          previousStatus,

        finalSubStatus:
          previousSubStatus,

        legacyComplaint: false,

        message:
          "Complaint rejected and order restored",

        complaint:
          rejectedComplaint,

        order:
          restoredOrder,

        history,

        journey,

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

    const updatedOrder =
      statusBody?.row ??
      statusBody?.order ??
      await findOrderByCandidates(
        supabase,
        [orderId]
      );

    return NextResponse.json({
      ok: true,
      complaintId:
        reservedComplaint.ComplaintId ??
        null,
      orderId,
      decision:
        "Approved",

      finalStatus,

      finalSubStatus,

      legacyComplaint: false,

      order:
        updatedOrder,

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
