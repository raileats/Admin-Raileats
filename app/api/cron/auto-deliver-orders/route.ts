export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncRestroRdsForFinalOrder } from "@/lib/restroRds";
import { updateOrderJourneySafe } from "@/lib/orderJourney";

const ELIGIBLE_STATUSES = [
  "Out for Delivery",
  "Restro Marked Delivered",
] as const;

function supabaseServer() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Supabase server environment variables are missing");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function parseDeliveryDate(value: unknown) {
  const text = clean(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

/*
 * 23:59:00 Asia/Kolkata = 18:29:00 UTC.
 */
function indiaEndOfDayUtc(
  year: number,
  month: number,
  day: number,
) {
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      18,
      29,
      0,
      0,
    ),
  );
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  daysToAdd: number,
) {
  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  date.setUTCDate(
    date.getUTCDate() + daysToAdd,
  );

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function lastDayOfMonth(
  year: number,
  month: number,
) {
  return new Date(
    Date.UTC(
      year,
      month,
      0,
    ),
  ).getUTCDate();
}

/*
 * Auto-delivery cutoff:
 *
 * 1. DeliveryDate + 2 calendar days at 23:59 IST
 * 2. Delivery month ka last day at 23:59 IST
 *
 * Dono me jo pehle aaye, wahi final cutoff hai.
 */
function getAutoDeliveredCutoff(
  deliveryDateValue: unknown,
) {
  const parsed =
    parseDeliveryDate(
      deliveryDateValue,
    );

  if (!parsed) {
    return null;
  }

  const plusTwo =
    addCalendarDays(
      parsed.year,
      parsed.month,
      parsed.day,
      2,
    );

  const normalCutoff =
    indiaEndOfDayUtc(
      plusTwo.year,
      plusTwo.month,
      plusTwo.day,
    );

  const monthEndCutoff =
    indiaEndOfDayUtc(
      parsed.year,
      parsed.month,
      lastDayOfMonth(
        parsed.year,
        parsed.month,
      ),
    );

  return normalCutoff.getTime() <=
    monthEndCutoff.getTime()
    ? normalCutoff
    : monthEndCutoff;
}

function isAuthorized(
  req: NextRequest,
) {
  const cronSecret =
    clean(
      process.env.CRON_SECRET,
    );

  /*
   * CRON_SECRET set nahi hai to existing behavior preserve:
   * endpoint open rahega.
   */
  if (!cronSecret) {
    return true;
  }

  const authorization =
    clean(
      req.headers.get(
        "authorization",
      ),
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

export async function GET(
  req: NextRequest,
) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const startedAt =
    new Date();

  const supabase =
    supabaseServer();

  try {
    const {
      data: rows,
      error: loadError,
    } =
      await supabase
        .from("Orders")
        .select("*")
        .in(
          "Status",
          [...ELIGIBLE_STATUSES],
        )
        .order(
          "DeliveryDate",
          {
            ascending: true,
          },
        );

    if (loadError) {
      throw loadError;
    }

    const results:
      Array<Record<string, any>> =
      [];

    for (
      const order of rows || []
    ) {
      const orderId =
        clean(
          order.OrderId,
        );

      const oldStatus =
        clean(
          order.Status,
        );

      const cutoff =
        getAutoDeliveredCutoff(
          order.DeliveryDate,
        );

      if (!orderId) {
        results.push({
          orderId: null,
          status: "skipped",
          reason:
            "Missing OrderId",
        });

        continue;
      }

      if (!cutoff) {
        results.push({
          orderId,
          status: "skipped",
          reason:
            "Invalid DeliveryDate",
          deliveryDate:
            order.DeliveryDate ??
            null,
        });

        continue;
      }

      if (
        startedAt.getTime() <
        cutoff.getTime()
      ) {
        results.push({
          orderId,
          status: "not_due",
          currentStatus:
            oldStatus,
          cutoffAt:
            cutoff.toISOString(),
        });

        continue;
      }

      /*
       * Important:
       *
       * RestroRDS me existing entry hone ki wajah se
       * auto-delivery ko skip nahi karna hai.
       *
       * Order ka operational status aur restaurant ledger
       * alag responsibilities hain.
       */

      const commission =
        Math.max(
          0,
          numberValue(
            order.Commission,
            0,
          ),
        );

      const orderPenalty =
        Math.max(
          0,
          numberValue(
            order.OrderPenalty,
            0,
          ),
        );

      const finalIGST =
        roundMoney(
          (
            commission +
            orderPenalty
          ) * 0.18,
        );

      const changedAt =
        new Date()
          .toISOString();

      const note =
        oldStatus ===
        "Restro Marked Delivered"
          ? "Automatically marked Delivered at 23:59 IST after restaurant delivery marking and date-wise waiting period"
          : "Automatically marked Delivered at 23:59 IST after date-wise waiting period";

      /*
       * Optimistic status guard:
       *
       * Cron load aur update ke beech kisi aur request ne status
       * change kar diya ho to us order ko overwrite nahi karenge.
       */
      const {
        data: updatedOrder,
        error: updateError,
      } =
        await supabase
          .from("Orders")
          .update({
            Status:
              "Delivered",
            SubStatus:
              "Delivered",
            UpdatedAt:
              changedAt,
            IGST:
              finalIGST,
          })
          .eq(
            "OrderId",
            orderId,
          )
          .eq(
            "Status",
            oldStatus,
          )
          .select("*")
          .maybeSingle();

      if (updateError) {
        results.push({
          orderId,
          status: "failed",
          reason:
            updateError.message,
        });

        continue;
      }

      if (!updatedOrder) {
        results.push({
          orderId,
          status: "skipped",
          reason:
            "Order status changed before cron update",
        });

        continue;
      }

      /*
       * OrderStatusHistory ki jagah OrderJourney.
       *
       * Safe helper use ho raha hai, isliye journey table me
       * temporary issue hone par main Orders update rollback/fail
       * nahi hoga.
       */
      const journeyResult =
        await updateOrderJourneySafe({
          supabase,
          orderId,
          stage:
            "Delivered",
          status:
            "Delivered",
          subStatus:
            "Delivered",
          remarks:
            note,
          userType:
            "Auto",
          userName:
            "System",
          source:
            "Auto Cron",
          actionAt:
            changedAt,
          order: {
            restroCode:
              updatedOrder.RestroCode ??
              order.RestroCode ??
              null,
            restroName:
              updatedOrder.RestroName ??
              order.RestroName ??
              null,
            stationCode:
              updatedOrder.StationCode ??
              order.StationCode ??
              null,
            stationName:
              updatedOrder.StationName ??
              order.StationName ??
              null,
            deliveryDate:
              updatedOrder.DeliveryDate ??
              order.DeliveryDate ??
              null,
            deliveryTime:
              updatedOrder.DeliveryTime ??
              order.DeliveryTime ??
              null,
          },
        });

      /*
       * RestroRDS sync existing behavior preserve karta hai.
       *
       * Lekin RDS locked/duplicate result ki wajah se order ko
       * Delivered hone se ab nahi roka jayega.
       */
      const rdsResult =
        await syncRestroRdsForFinalOrder({
          supabase,
          orderId,
          remarks:
            note,
        });

      results.push({
        orderId,
        status:
          "delivered",
        previousStatus:
          oldStatus,
        deliveryDate:
          order.DeliveryDate ??
          null,
        cutoffAt:
          cutoff.toISOString(),
        changedAt,

        journey:
          journeyResult,

        journeyWarning:
          journeyResult
            ? null
            : "OrderJourney update failed. Check server logs.",

        restroRdsSkipped:
          rdsResult.skipped ??
          false,

        restroRdsLocked:
          rdsResult.locked ??
          false,

        restroRdsWarning:
          rdsResult.warning ??
          null,
      });
    }

    return NextResponse.json({
      ok: true,
      checkedAt:
        startedAt.toISOString(),
      eligibleStatuses:
        ELIGIBLE_STATUSES,
      checked:
        (rows || []).length,
      delivered:
        results.filter(
          (item) =>
            item.status ===
            "delivered",
        ).length,
      results,
    });
  } catch (
    error: any
  ) {
    console.error(
      "AUTO DELIVER CRON ERROR",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to run auto-delivered cron",
      },
      {
        status: 500,
      },
    );
  }
}
