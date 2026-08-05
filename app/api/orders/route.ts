// app/api/orders/route.ts

import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";
import { updateOrderJourneySafe } from "@/lib/orderJourney";

/**
 * Expected payload from raileats.in CheckoutClient (approx):
 *
 * {
 *   restro_code: number | string;              // RestroCode
 *   customer: {
 *     full_name: string;
 *     phone: string;
 *   };
 *   delivery: {
 *     train_no: string;
 *     coach: string;
 *     seat: string;
 *     delivery_date?: string;                 // "YYYY-MM-DD" (optional)
 *     delivery_time?: string;                 // "HH:MM" (optional)
 *     note?: string | null;
 *   };
 *   pricing: {
 *     subtotal: number;
 *     gst?: number;
 *     platform_charge?: number;
 *     total: number;
 *     payment_mode?: "COD" | "ONLINE";
 *   };
 *   items: {
 *     item_id: number;
 *     name: string;
 *     qty: number;
 *     base_price: number;
 *     line_total: number;
 *   }[];
 *   meta?: any;
 * }
 */

type Payload = {
  restro_code: string | number;

  customer: {
    full_name: string;
    phone: string;
  };

  delivery: {
    train_no: string;
    coach: string;
    seat: string;
    delivery_date?: string;
    delivery_time?: string;
    note?: string | null;
  };

  pricing: {
    subtotal: number;
    gst?: number;
    platform_charge?: number;
    total: number;
    payment_mode?: "COD" | "ONLINE";
  };

  items: {
    item_id: number;
    name: string;
    qty: number;
    base_price: number;
    line_total: number;
  }[];

  meta?: any;
};

type RestroMasterRow = {
  RestroCode: number;
  RestroName: string | null;
  StationCode: string | null;
  StationName: string | null;
};

type MenuRow = {
  id: number;
  restro_code: number;
  item_code: number | null;
  item_name: string;
  item_description?: string | null;
  item_category?: string | null;
  item_cuisine?: string | null;
  menu_type?: string | null;
  base_price?: number | null;
  gst_percent?: number | null;
  selling_price?: number | null;
};

function generateOrderId() {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const ms = String(now.getTime()).slice(-5);

  return `BOO-${y}${m}${d}-${ms}`;
}

function todayYMD() {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function timeHM() {
  const now = new Date();

  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");

  return `${h}:${m}`;
}

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();

  return text || null;
}

function getBookingSource(meta: any) {
  return (
    cleanText(meta?.BookingSource) ||
    cleanText(meta?.bookingSource) ||
    cleanText(meta?.source) ||
    cleanText(meta?.Source) ||
    "Website"
  );
}

/* =========================================================
   POST: CREATE NEW ORDER FROM RAILEATS.IN
========================================================= */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    /* =======================================================
       BASIC VALIDATIONS
    ======================================================= */

    if (!body?.restro_code) {
      return NextResponse.json(
        {
          error: "missing_restroc_code",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body?.customer?.full_name ||
      !body?.customer?.phone
    ) {
      return NextResponse.json(
        {
          error: "missing_customer",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body?.delivery?.train_no ||
      !body?.delivery?.coach ||
      !body?.delivery?.seat
    ) {
      return NextResponse.json(
        {
          error: "missing_delivery",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(body?.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "empty_items",
        },
        {
          status: 400,
        }
      );
    }

    const supa = serviceClient;
    const restroCodeNum = Number(body.restro_code);

    if (
      !Number.isFinite(restroCodeNum) ||
      restroCodeNum <= 0
    ) {
      return NextResponse.json(
        {
          error: "invalid_restro_code",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       1. LOAD RESTAURANT AND STATION DETAILS
    ======================================================= */

    const {
      data: restroData,
      error: restroErr,
    } = await supa
      .from("RestroMaster")
      .select(
        "RestroCode, RestroName, StationCode, StationName"
      )
      .eq("RestroCode", restroCodeNum)
      .maybeSingle();

    const restro =
      (restroData || null) as RestroMasterRow | null;

    if (restroErr) {
      console.error(
        "RestroMaster error",
        restroErr
      );

      return NextResponse.json(
        {
          error: "restro_lookup_failed",
        },
        {
          status: 500,
        }
      );
    }

    if (!restro) {
      return NextResponse.json(
        {
          error: "restro_not_found",
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       2. LOAD MENU ROWS FOR COMPLETE ORDER ITEMS
    ======================================================= */

    const itemIds = body.items
      .map((item) => Number(item.item_id))
      .filter((id) => Number.isFinite(id));

    const {
      data: menuRowsData,
      error: menuErr,
    } = await supa
      .from("RestroMenuItems")
      .select(
        `
          id,
          restro_code,
          item_code,
          item_name,
          item_description,
          item_category,
          item_cuisine,
          menu_type,
          base_price,
          gst_percent,
          selling_price
        `
      )
      .in("id", itemIds);

    if (menuErr) {
      console.error(
        "Menu lookup error",
        menuErr
      );

      return NextResponse.json(
        {
          error: "menu_lookup_failed",
        },
        {
          status: 500,
        }
      );
    }

    const menuRows =
      (menuRowsData || []) as MenuRow[];

    const menuById =
      new Map<number, MenuRow>();

    menuRows.forEach((row) => {
      menuById.set(
        Number(row.id),
        row
      );
    });

    /* =======================================================
       3. GENERATE ORDER ID AND TIME
    ======================================================= */

    const orderId = generateOrderId();
    const nowIso = new Date().toISOString();

    const {
      customer,
      delivery,
      pricing,
    } = body;

    const deliveryDate =
      delivery.delivery_date ||
      todayYMD();

    const deliveryTime =
      delivery.delivery_time ||
      timeHM();

    const bookingSource =
      getBookingSource(body.meta);

    /* =======================================================
       4. INSERT ORDERS TABLE
    ======================================================= */

    const {
      error: orderInsertErr,
    } = await supa
      .from("Orders")
      .insert({
        OrderId: orderId,

        RestroCode:
          restro.RestroCode,

        RestroName:
          restro.RestroName,

        StationCode:
          restro.StationCode,

        StationName:
          restro.StationName,

        DeliveryDate:
          deliveryDate,

        DeliveryTime:
          deliveryTime,

        TrainNumber:
          delivery.train_no,

        Coach:
          delivery.coach,

        Seat:
          delivery.seat,

        CustomerName:
          customer.full_name,

        CustomerMobile:
          customer.phone,

        SubTotal:
          pricing.subtotal,

        GSTAmount:
          pricing.gst ?? 0,

        PlatformCharge:
          pricing.platform_charge ?? 0,

        TotalAmount:
          pricing.total,

        PaymentMode:
          pricing.payment_mode ?? "COD",

        /*
         * Existing behavior preserve kiya gaya hai.
         * Order create ke waqt Orders.Status lowercase booked rahega.
         */
        Status: "booked",

        JourneyPayload:
          body.meta ?? null,

        CreatedAt:
          nowIso,

        UpdatedAt:
          nowIso,
      });

    if (orderInsertErr) {
      console.error(
        "Orders insert error",
        orderInsertErr
      );

      return NextResponse.json(
        {
          error: "order_insert_failed",
        },
        {
          status: 500,
        }
      );
    }

    /* =======================================================
       5. INSERT ORDER ITEMS
    ======================================================= */

    const orderItemsPayload =
      body.items.map((item) => {
        const row =
          menuById.get(
            Number(item.item_id)
          );

        return {
          OrderId:
            orderId,

          RestroCode:
            restro.RestroCode,

          ItemCode:
            row?.item_code ??
            item.item_id,

          ItemName:
            row?.item_name ??
            item.name,

          ItemDescription:
            row?.item_description ??
            null,

          ItemCategory:
            row?.item_category ??
            null,

          Cuisine:
            row?.item_cuisine ??
            null,

          MenuType:
            row?.menu_type ??
            null,

          BasePrice:
            row?.base_price ??
            item.base_price,

          GSTPercent:
            row?.gst_percent ??
            null,

          SellingPrice:
            row?.selling_price ??
            item.base_price,

          Quantity:
            item.qty,

          LineTotal:
            item.line_total,
        };
      });

    const {
      error: itemsInsertErr,
    } = await supa
      .from("OrderItems")
      .insert(orderItemsPayload);

    if (itemsInsertErr) {
      console.error(
        "OrderItems insert error",
        itemsInsertErr
      );

      return NextResponse.json(
        {
          error: "order_items_insert_failed",
        },
        {
          status: 500,
        }
      );
    }

    /* =======================================================
       6. CREATE ORDER JOURNEY BOOKED STAGE

       OrderStatusHistory ka initial insert remove kar diya hai.
       Ab OrderJourney single source of truth hai.

       Safe helper use kiya hai:
       Journey error hone par booked order fail nahi hoga.
    ======================================================= */

    const journeyResult =
      await updateOrderJourneySafe({
        supabase: supa,

        orderId,

        stage: "Booked",

        status: "Booked",

        subStatus: null,

        remarks:
          delivery.note ||
          "Order created",

        userType:
          "Customer",

        userName:
          customer.full_name,

        source:
          bookingSource,

        actionAt:
          nowIso,

        order: {
          restroCode:
            restro.RestroCode,

          restroName:
            restro.RestroName,

          stationCode:
            restro.StationCode,

          stationName:
            restro.StationName,

          deliveryDate:
            deliveryDate,

          deliveryTime:
            deliveryTime,
        },
      });

    if (!journeyResult) {
      console.error(
        "OrderJourney booked stage could not be created",
        {
          orderId,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      order_id: orderId,
      journey_created:
        Boolean(journeyResult),
    });
  } catch (err) {
    console.error(
      "orders.POST error",
      err
    );

    return NextResponse.json(
      {
        error: "server_error",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   GET: FETCH ORDERS FOR ADMIN UI
========================================================= */

export async function GET(req: Request) {
  try {
    const supa = serviceClient;

    const {
      searchParams,
    } = new URL(req.url);

    const rawStatusFilter =
      String(
        searchParams.get("status") || ""
      ).trim();

    const normalizedStatusFilter =
      rawStatusFilter
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ""
        );

    const statusMap:
      Record<string, string> = {
        booked:
          "Booked",

        verification:
          "In Verification",

        inverification:
          "In Verification",

        cancellationrequest:
          "Cancellation Request",

        neworder:
          "New Order",

        inkitchen:
          "In Kitchen",

        outfordelivery:
          "Out for Delivery",

        delivered:
          "Delivered",

        cancelled:
          "Cancelled",

        canceled:
          "Cancelled",

        notdelivered:
          "Not Delivered",

        baddelivery:
          "Bad Delivery",

        partialdelivery:
          "Partial Delivery",

        complaints:
          "Complaints",

        complaint:
          "Complaints",

        restromarkeddelivered:
          "Restro Marked Delivered",

        refund:
          "Refund",
      };

    const dbStatus =
      normalizedStatusFilter
        ? statusMap[
            normalizedStatusFilter
          ] || rawStatusFilter
        : null;

    const orderId =
      String(
        searchParams.get("orderId") ||
          ""
      ).trim();

    const customerMobile =
      String(
        searchParams.get(
          "customerMobile"
        ) || ""
      )
        .replace(/\D/g, "")
        .slice(0, 15);

    const outlet =
      String(
        searchParams.get("outlet") ||
          ""
      ).trim();

    const station =
      String(
        searchParams.get("station") ||
          ""
      ).trim();

    const trainNo =
      String(
        searchParams.get("trainNo") ||
          ""
      ).trim();

    const dateType =
      String(
        searchParams.get("dateType") ||
          "delivery"
      ).trim();

    const dateFrom =
      String(
        searchParams.get("dateFrom") ||
          ""
      ).trim();

    const dateTo =
      String(
        searchParams.get("dateTo") ||
          ""
      ).trim();

    const safeLike = (
      value: string
    ) =>
      value
        .replace(
          /[%_,]/g,
          ""
        )
        .slice(0, 100);

    const orderSelect = `
      OrderId,
      RestroCode,
      RestroName,
      StationCode,
      StationName,
      DeliveryDate,
      DeliveryTime,
      TrainNumber,
      Coach,
      Seat,
      CustomerName,
      CustomerMobile,
      TotalAmount,
      PaymentMode,
      Status,
      SubStatus,
      RefundStatus,
      RefundReference,
      RefundRequestedAmount,
      RefundApprovedAmount,
      RefundRequestedAt,
      CreatedAt
    `;

    const applyCommonOrderFilters = (
      query: any
    ) => {
      if (orderId) {
        query = query.ilike(
          "OrderId",
          `%${safeLike(orderId)}%`
        );
      }

      if (customerMobile) {
        query = query.ilike(
          "CustomerMobile",
          `%${customerMobile}%`
        );
      }

      if (outlet) {
        const safeOutlet =
          safeLike(outlet);

        const outletFilters = [
          `RestroName.ilike.%${safeOutlet}%`,
        ];

        const outletDigits =
          safeOutlet.replace(
            /\D/g,
            ""
          );

        if (outletDigits) {
          outletFilters.push(
            `RestroCode.eq.${Number(
              outletDigits
            )}`
          );
        }

        query = query.or(
          outletFilters.join(",")
        );
      }

      if (station) {
        const safeStation =
          safeLike(station);

        query = query.or(
          `StationCode.ilike.%${safeStation}%,StationName.ilike.%${safeStation}%`
        );
      }

      if (trainNo) {
        query = query.ilike(
          "TrainNumber",
          `%${safeLike(trainNo)}%`
        );
      }

      if (dateFrom || dateTo) {
        if (
          dateType === "booking"
        ) {
          if (dateFrom) {
            query = query.gte(
              "CreatedAt",
              dateFrom
            );
          }

          if (dateTo) {
            query = query.lte(
              "CreatedAt",
              dateTo
            );
          }
        } else {
          const fromDate =
            dateFrom.slice(0, 10);

          const toDate =
            dateTo.slice(0, 10);

          if (fromDate) {
            query = query.gte(
              "DeliveryDate",
              fromDate
            );
          }

          if (toDate) {
            query = query.lte(
              "DeliveryDate",
              toDate
            );
          }
        }
      }

      return query;
    };

    const mapOrder = (
      row: any,
      extra:
        Record<string, any> = {}
    ) => ({
      id:
        String(
          row.OrderId ?? ""
        ),

      status:
        String(
          row.Status ||
            "booked"
        ),

      Status:
        String(
          row.Status ||
            "booked"
        ),

      restroCode:
        row.RestroCode,

      restroName:
        row.RestroName,

      stationCode:
        row.StationCode,

      stationName:
        row.StationName,

      deliveryDate:
        row.DeliveryDate,

      deliveryTime:
        row.DeliveryTime,

      trainNumber:
        row.TrainNumber,

      coach:
        row.Coach,

      seat:
        row.Seat,

      customerName:
        row.CustomerName,

      customerMobile:
        row.CustomerMobile,

      totalAmount:
        Number(
          row.TotalAmount ?? 0
        ),

      paymentMode:
        row.PaymentMode ?? "COD",

      PaymentMode:
        row.PaymentMode ?? "COD",

      subStatus:
        row.SubStatus ?? null,

      SubStatus:
        row.SubStatus ?? null,

      RefundStatus:
        row.RefundStatus ?? null,

      RefundNo:
        row.RefundReference ?? null,

      RefundRequestedAmount:
        row.RefundRequestedAmount ?? null,

      RefundApprovedAmount:
        row.RefundApprovedAmount ?? null,

      RefundRequestedAt:
        row.RefundRequestedAt ?? null,

      PaidAmount:
        null,

      PPDAmount:
        null,

      TotalAmount:
        row.TotalAmount ?? null,

      CreatedAt:
        row.CreatedAt ?? null,

      history:
        [] as any[],

      ...extra,
    });

    /* =======================================================
       REFUND TAB
    ======================================================= */

    if (
      normalizedStatusFilter ===
      "refund"
    ) {
      const refundQuery = supa
        .from("OrderRefunds")
        .select("*")
        .order(
          "CreatedAt",
          {
            ascending: false,
          }
        );

      const {
        data: refundRows,
        error: refundError,
      } = await refundQuery;

      if (refundError) {
        console.error(
          "OrderRefunds GET error",
          refundError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "refunds_fetch_failed",
            details:
              refundError.message,
          },
          {
            status: 500,
          }
        );
      }

      let auditOrdersQuery = supa
        .from("Orders")
        .select(
          "OrderId,RefundStatus,RefundReference,RefundRequestedAt,RefundRequestedAmount,RefundApprovedAmount"
        )
        .or(
          "RefundStatus.not.is.null,RefundReference.not.is.null,RefundRequestedAt.not.is.null,RefundRequestedAmount.not.is.null,RefundApprovedAmount.not.is.null"
        );

      auditOrdersQuery =
        applyCommonOrderFilters(
          auditOrdersQuery
        );

      const {
        data: auditOrderRows,
        error: auditOrderError,
      } = await auditOrdersQuery;

      if (auditOrderError) {
        console.error(
          "Refund audit Orders GET error",
          auditOrderError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "refund_audit_orders_fetch_failed",
            details:
              auditOrderError.message,
          },
          {
            status: 500,
          }
        );
      }

      const refundOrderIds =
        Array.from(
          new Set(
            [
              ...(refundRows || []),
              ...(auditOrderRows || []).filter(
                (row: any) =>
                  [
                    row.RefundStatus,
                    row.RefundReference,
                    row.RefundRequestedAt,
                  ].some(
                    (value) =>
                      value !== null &&
                      value !== undefined &&
                      String(value).trim() !== ""
                  ) ||
                  [row.RefundRequestedAmount, row.RefundApprovedAmount].some(
                    (value) => {
                      const amount = Number(value);
                      return Number.isFinite(amount) && amount > 0;
                    }
                  )
              ),
            ]
              .map((row: any) =>
                String(
                  row.OrderId ||
                    ""
                ).trim()
              )
              .filter(Boolean)
          )
        );

      if (
        refundOrderIds.length === 0
      ) {
        return NextResponse.json({
          ok: true,
          orders: [],
        });
      }

      let ordersQuery = supa
        .from("Orders")
        .select(orderSelect)
        .in(
          "OrderId",
          refundOrderIds
        )
        .order(
          "CreatedAt",
          {
            ascending: false,
          }
        );

      ordersQuery =
        applyCommonOrderFilters(
          ordersQuery
        );

      const {
        data: orderRows,
        error: orderError,
      } = await ordersQuery;

      if (orderError) {
        console.error(
          "Refund Orders GET error",
          orderError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "orders_fetch_failed",
            details:
              orderError.message,
          },
          {
            status: 500,
          }
        );
      }

      const orderById =
        new Map<string, any>();

      (orderRows || []).forEach(
        (row: any) => {
          orderById.set(
            String(
              row.OrderId || ""
            ),
            row
          );
        }
      );

      const refundByOrderId =
        new Map<string, any>();

      (refundRows || []).forEach(
        (row: any) => {
          const key = String(
            row.OrderId || ""
          );
          if (
            key &&
            !refundByOrderId.has(key)
          ) {
            refundByOrderId.set(
              key,
              row
            );
          }
        }
      );

      const orders =
        (orderRows || [])
          .map(
            (orderRow: any) => {
              const refund =
                refundByOrderId.get(
                  String(
                    orderRow.OrderId ||
                      ""
                  )
                ) || {};

              const linkedOrder =
                orderById.get(
                  String(
                    orderRow.OrderId ||
                      ""
                  )
                );

              const dbRefundStatus =
                String(
                  refund.RefundStatus ||
                    ""
                );

              const orderRefundStatus =
                linkedOrder.RefundStatus ||
                ({
                  Pending:
                    refund.ReviewedAt
                      ? "RefundUnderReview"
                      : "RefundRequested",
                  Approved:
                    "RefundApproved",
                  Processing:
                    "RefundProcessing",
                  Success:
                    "RefundCompleted",
                  Failed:
                    "RefundFailed",
                } as Record<
                  string,
                  string
                >)[dbRefundStatus] ||
                null;

              return mapOrder(
                linkedOrder,
                {
                  ...refund,

                  RefundId:
                    refund.RefundId ??
                    refund.id ??
                    null,

                  RefundNo:
                    refund.RefundNo ??
                    linkedOrder.RefundReference ??
                    null,

                  RefundStatus:
                    orderRefundStatus,

                  RefundRequestedAmount:
                    linkedOrder.RefundRequestedAmount ??
                    refund.RefundAmount ??
                    null,

                  RefundApprovedAmount:
                    linkedOrder.RefundApprovedAmount ??
                    refund.ApprovedAmount ??
                    null,

                  RefundRequestedAt:
                    linkedOrder.RefundRequestedAt ??
                    refund.RequestedAt ??
                    null,

                  RefundAmount:
                    Number(
                      refund.RefundAmount ??
                        refund.PaidAmount ??
                        linkedOrder.TotalAmount ??
                        0
                    ),

                  PaidAmount:
                    Number(
                      refund.PaidAmount ??
                        linkedOrder.TotalAmount ??
                        0
                    ),

                  OrderStatus:
                    linkedOrder.Status,

                  OrderSubStatus:
                    linkedOrder.SubStatus,
                }
              );
            }
          )
          .filter(Boolean);

      return NextResponse.json({
        ok: true,
        orders,
      });
    }

    /* =======================================================
       NORMAL AND COMPLAINT TABS
    ======================================================= */

    let query = supa
      .from("Orders")
      .select(orderSelect)
      .order(
        "CreatedAt",
        {
          ascending: false,
        }
      );

    if (
      normalizedStatusFilter &&
      normalizedStatusFilter !==
        "all"
    ) {
      if (
        normalizedStatusFilter ===
        "baddelivery"
      ) {
        query = query
          .eq(
            "Status",
            "Delivered"
          )
          .eq(
            "SubStatus",
            "Bad Delivery"
          );
      } else if (
        normalizedStatusFilter ===
        "partialdelivery"
      ) {
        query = query
          .eq(
            "Status",
            "Delivered"
          )
          .eq(
            "SubStatus",
            "Partial Delivery"
          );
      } else if (dbStatus) {
        query = query.eq(
          "Status",
          dbStatus
        );
      }
    }

    query =
      applyCommonOrderFilters(
        query
      );

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Orders GET error",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "orders_fetch_failed",
          details:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    const complaintByOrder =
      new Map<string, any>();

    if (
      normalizedStatusFilter ===
        "complaints" ||
      normalizedStatusFilter ===
        "all"
    ) {
      const ids =
        (data || [])
          .map((row: any) =>
            String(
              row.OrderId || ""
            ).trim()
          )
          .filter(Boolean);

      if (ids.length > 0) {
        const {
          data: complaintRows,
          error: complaintError,
        } = await supa
          .from(
            "OrderComplaints"
          )
          .select(
            "ComplaintId,ComplaintNo,OrderId,ComplaintStatus,RequestedSubStatus,ComplaintRemarks,CreatedAt"
          )
          .in(
            "OrderId",
            ids
          )
          .order(
            "CreatedAt",
            {
              ascending: false,
            }
          );

        if (complaintError) {
          console.error(
            "OrderComplaints GET error",
            complaintError
          );

          return NextResponse.json(
            {
              ok: false,
              error:
                "complaints_fetch_failed",
              details:
                complaintError.message,
            },
            {
              status: 500,
            }
          );
        }

        (
          complaintRows || []
        ).forEach((row: any) => {
          const key =
            String(
              row.OrderId || ""
            );

          const existing =
            complaintByOrder.get(
              key
            );

          if (
            key &&
            (!existing ||
              (row.ComplaintStatus ===
                "Pending" &&
                existing.ComplaintStatus !==
                  "Pending"))
          ) {
            complaintByOrder.set(
              key,
              {
                ...row,
                ComplaintReason:
                  row.RequestedSubStatus ??
                  null,
                ComplaintCreatedAt:
                  row.CreatedAt ??
                  null,
              }
            );
          }
        });
      }
    }

    const orders =
      (data || []).map(
        (row: any) =>
          mapOrder(
            row,
            complaintByOrder.get(
              String(
                row.OrderId || ""
              )
            ) || {}
          )
      );

    return NextResponse.json({
      ok: true,
      orders,
    });
  } catch (err: any) {
    console.error(
      "orders.GET error",
      err
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "server_error",
        details:
          err?.message ||
          null,
      },
      {
        status: 500,
      }
    );
  }
}
