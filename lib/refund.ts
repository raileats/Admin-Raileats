import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TABLES = {
  orders: "Orders",
  refunds: "Refunds",
} as const;

const TRANSACTION_RPC = "raileats_apply_refund_transition";
const ELIGIBLE_ORDER_STATUSES = new Set(["delivered", "baddelivery", "partialdelivery"]);
const ACTIVE_REFUND_STATUSES = [
  "RefundRequested",
  "RefundUnderReview",
  "RefundApproved",
  "RefundProcessing",
] as const;

export type RefundStatus =
  | "NoRefund"
  | "RefundRequested"
  | "RefundUnderReview"
  | "RefundApproved"
  | "RefundProcessing"
  | "RefundCompleted"
  | "RefundRejected"
  | "RefundFailed"
  | "RefundCancelled";

export type PaymentMode = "COD" | "PREPAID";
export type RefundJourneyStage =
  | "RefundRequested"
  | "RefundUnderReview"
  | "RefundApproved"
  | "RefundProcessing"
  | "RefundCompleted";

export type RefundErrorCode =
  | "CONFIGURATION_ERROR"
  | "INVALID_ARGUMENT"
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_ELIGIBLE"
  | "UNSUPPORTED_PAYMENT_MODE"
  | "COD_MANUAL_APPROVAL_REQUIRED"
  | "DUPLICATE_REFUND"
  | "REFUND_NOT_FOUND"
  | "INVALID_REFUND_STATE"
  | "INVALID_AMOUNT"
  | "AMOUNT_EXCEEDS_PAID_AMOUNT"
  | "CONCURRENT_UPDATE"
  | "DATABASE_ERROR";

export interface RefundActor {
  userType: string;
  userName: string;
  source: string;
  ip?: string;
  device?: string;
}

export interface RefundRecord {
  refundId: string;
  refundReference: string;
  orderId: string;
  refundAttempt: number;
  status: RefundStatus;
  paymentMode: PaymentMode;
  requestedAmount: number;
  approvedAmount: number | null;
  reason: string;
  remarks: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  processingStartedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface RefundSuccess {
  ok: true;
  data: RefundRecord;
}

export interface RefundFailure {
  ok: false;
  error: {
    code: RefundErrorCode;
    message: string;
  };
}

export type RefundResponse = RefundSuccess | RefundFailure;

interface CommonInput {
  orderId: string;
  actor: RefundActor;
  remarks?: string;
}

export interface RequestRefundInput extends CommonInput {
  requestedAmount: number;
  reason: string;
}

export interface ReviewRefundInput extends CommonInput {}

export interface ApproveRefundInput extends CommonInput {
  approvedAmount: number;
  /** COD refunds require an explicit manual approval decision. */
  approveCodManually?: boolean;
}

export interface RejectRefundInput extends CommonInput {
  remarks: string;
}

export interface StartRefundProcessingInput extends CommonInput {
  refundMethod?: string;
  paymentProvider?: string;
  gatewayTransactionId?: string;
}

export interface CompleteRefundInput extends CommonInput {
  providerRefundId: string;
}

interface DbOrder extends Record<string, unknown> {
  OrderId: string;
  OrderStatus?: string | null;
  Status?: string | null;
  PaymentMode?: string | null;
  PaymentMethod?: string | null;
  PaidAmount?: number | string | null;
  AmountPaid?: number | string | null;
  TotalPaidAmount?: number | string | null;
  OrderAmount?: number | string | null;
  CustomerId?: string | null;
  CustomerName?: string | null;
  CustomerMobile?: string | null;
  RestroCode?: number | string | null;
  RestroName?: string | null;
  TrainNo?: string | null;
  DeliveryDate?: string | null;
  DeliveryTime?: string | null;
  StationCode?: string | null;
  StationName?: string | null;
}

interface DbRefund extends Record<string, unknown> {
  RefundId: string;
  RefundReference: string;
  OrderId: string;
  RefundAttempt: number | string;
  RefundStatus: RefundStatus;
  PaymentMode?: string | null;
  RequestedAmount: number | string;
  ApprovedAmount?: number | string | null;
  RefundReason: string;
  RefundRemarks?: string | null;
  RequestedAt: string;
  ReviewedAt?: string | null;
  ApprovedAt?: string | null;
  ProcessingStartedAt?: string | null;
  CompletedAt?: string | null;
  UpdatedAt: string;
}

interface RefundContext {
  order: DbOrder;
  refund: DbRefund;
  paidAmount: number;
  paymentMode: PaymentMode;
}

interface TransactionPayload {
  order_id: string;
  refund_attempt: number;
  expected_refund_status: RefundStatus | null;
  create_refund: boolean;
  order_patch: Record<string, unknown>;
  refund_patch: Record<string, unknown>;
  journey_patch: Record<string, unknown>;
}

class RefundEngineError extends Error {
  constructor(
    readonly code: RefundErrorCode,
    message: string,
    readonly databaseCode?: string,
  ) {
    super(message);
    this.name = "RefundEngineError";
  }
}

let serviceRoleClient: SupabaseClient | undefined;

function supabase(): SupabaseClient {
  if (serviceRoleClient) return serviceRoleClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new RefundEngineError(
      "CONFIGURATION_ERROR",
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }

  serviceRoleClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { "X-RailEats-Client": "refund-engine" } },
  });

  return serviceRoleClient;
}

function normalize(value: unknown): string {
  return String(value ?? "").replace(/[\s_-]+/g, "").toLowerCase();
}

function requiredText(value: string | undefined, field: string): string {
  const result = value?.trim();
  if (!result) throw new RefundEngineError("INVALID_ARGUMENT", `${field} is required`);
  return result;
}

function validateInput(input: CommonInput): void {
  const orderId = requiredText(input.orderId, "orderId");
  if (!/^RE-\d{8}-\d+$/.test(orderId)) {
    throw new RefundEngineError("INVALID_ARGUMENT", "orderId has an invalid RailEats format");
  }
  requiredText(input.actor.userType, "actor.userType");
  requiredText(input.actor.userName, "actor.userName");
  requiredText(input.actor.source, "actor.source");
}

function numberValue(value: unknown, field: string): number {
  const result = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(result)) {
    throw new RefundEngineError("INVALID_AMOUNT", `${field} is not a valid amount`);
  }
  return result;
}

function orderPaidAmount(order: DbOrder): number {
  const amount = numberValue(
    order.PaidAmount ?? order.AmountPaid ?? order.TotalPaidAmount ?? order.OrderAmount,
    "order paid amount",
  );
  if (amount < 0) throw new RefundEngineError("INVALID_AMOUNT", "Order paid amount cannot be negative");
  return amount;
}

function orderPaymentMode(order: DbOrder): PaymentMode {
  const value = normalize(order.PaymentMode ?? order.PaymentMethod);
  if (value === "cod" || value === "cashondelivery") return "COD";
  if (["prepaid", "online", "paid", "upi", "card", "netbanking", "wallet"].includes(value)) {
    return "PREPAID";
  }
  throw new RefundEngineError("UNSUPPORTED_PAYMENT_MODE", "Order payment mode must be COD or PREPAID");
}

async function getOrder(orderId: string): Promise<DbOrder> {
  const { data, error } = await supabase()
    .from(TABLES.orders)
    .select("*")
    .eq("OrderId", orderId)
    .maybeSingle();

  if (error) throw databaseError(error);
  if (!data) throw new RefundEngineError("ORDER_NOT_FOUND", `Order ${orderId} was not found`);
  return data as DbOrder;
}

async function getRefund(orderId: string): Promise<DbRefund | null> {
  const { data, error } = await supabase()
    .from(TABLES.refunds)
    .select("*")
    .eq("OrderId", orderId)
    .order("RefundAttempt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw databaseError(error);
  return data as DbRefund | null;
}

function validateRefundEligibility(order: DbOrder): void {
  const status = normalize(order.OrderStatus ?? order.Status);
  if (!ELIGIBLE_ORDER_STATUSES.has(status)) {
    throw new RefundEngineError(
      "ORDER_NOT_ELIGIBLE",
      "Only Delivered, Bad Delivery, or Partial Delivery orders are eligible for refunds",
    );
  }
}

function validateRefundAmount(
  requestedAmount: number,
  paidAmount: number,
  approvedAmount?: number,
): void {
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new RefundEngineError("INVALID_AMOUNT", "RequestedAmount must be greater than zero");
  }
  if (requestedAmount > paidAmount) {
    throw new RefundEngineError(
      "AMOUNT_EXCEEDS_PAID_AMOUNT",
      "RequestedAmount cannot exceed the order paid amount",
    );
  }
  if (approvedAmount !== undefined) {
    if (!Number.isFinite(approvedAmount) || approvedAmount < 0) {
      throw new RefundEngineError("INVALID_AMOUNT", "ApprovedAmount must be zero or greater");
    }
    if (approvedAmount > requestedAmount || approvedAmount > paidAmount) {
      throw new RefundEngineError(
        "AMOUNT_EXCEEDS_PAID_AMOUNT",
        "ApprovedAmount cannot exceed RequestedAmount or the order paid amount",
      );
    }
  }
}

function buildRefundReference(orderId: string, attempt: number): string {
  const compactOrderId = orderId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `RF-${compactOrderId}-${String(attempt).padStart(2, "0")}-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function nextRefundAttempt(refund: DbRefund | null): number {
  if (!refund) return 1;
  const current = Number(refund.RefundAttempt);
  if (!Number.isSafeInteger(current) || current < 1) {
    throw new RefundEngineError("DATABASE_ERROR", "Stored RefundAttempt is invalid");
  }
  return current + 1;
}

function isActive(refund: DbRefund | null): boolean {
  return refund !== null && ACTIVE_REFUND_STATUSES.includes(
    refund.RefundStatus as (typeof ACTIVE_REFUND_STATUSES)[number],
  );
}

function assertStatus(refund: DbRefund, allowed: readonly RefundStatus[]): void {
  if (!allowed.includes(refund.RefundStatus)) {
    throw new RefundEngineError(
      "INVALID_REFUND_STATE",
      `Refund is ${refund.RefundStatus}; expected ${allowed.join(" or ")}`,
    );
  }
}

function actionParts(now: string): { date: string; time: string } {
  return { date: now.slice(0, 10), time: now.slice(11, 19) };
}

function buildJourneyPatch(
  stage: RefundJourneyStage,
  actor: RefundActor,
  remarks: string | undefined,
  now: string,
): Record<string, unknown> {
  const action = actionParts(now);
  return {
    [`${stage}Update`]: stage,
    [`${stage}Remarks`]: remarks?.trim() || null,
    [`${stage}UserType`]: actor.userType.trim(),
    [`${stage}UserName`]: actor.userName.trim(),
    [`${stage}Source`]: actor.source.trim(),
    [`${stage}ActionAtDate`]: action.date,
    [`${stage}ActionAtTime`]: action.time,
  };
}

function mapRefund(row: DbRefund): RefundRecord {
  return {
    refundId: row.RefundId,
    refundReference: row.RefundReference,
    orderId: row.OrderId,
    refundAttempt: Number(row.RefundAttempt),
    status: row.RefundStatus,
    paymentMode: normalize(row.PaymentMode) === "cod" ? "COD" : "PREPAID",
    requestedAmount: Number(row.RequestedAmount),
    approvedAmount: row.ApprovedAmount == null ? null : Number(row.ApprovedAmount),
    reason: row.RefundReason,
    remarks: row.RefundRemarks ?? null,
    requestedAt: row.RequestedAt,
    reviewedAt: row.ReviewedAt ?? null,
    approvedAt: row.ApprovedAt ?? null,
    processingStartedAt: row.ProcessingStartedAt ?? null,
    completedAt: row.CompletedAt ?? null,
    updatedAt: row.UpdatedAt,
  };
}

function databaseError(error: { code?: string; message: string }): RefundEngineError {
  if (error.code === "23505") {
    return new RefundEngineError("DUPLICATE_REFUND", "A conflicting refund already exists", error.code);
  }
  if (error.code === "40001" || error.code === "P0002") {
    return new RefundEngineError("CONCURRENT_UPDATE", "Refund state changed concurrently", error.code);
  }
  return new RefundEngineError("DATABASE_ERROR", error.message, error.code);
}

async function applyTransaction(payload: TransactionPayload): Promise<RefundRecord> {
  const { data, error } = await supabase().rpc(TRANSACTION_RPC, { p_transition: payload });
  if (error) throw databaseError(error);

  const row = (Array.isArray(data) ? data[0] : data) as DbRefund | null;
  if (!row) throw new RefundEngineError("DATABASE_ERROR", "Refund transaction returned no record");
  return mapRefund(row);
}

async function loadContext(input: CommonInput): Promise<RefundContext> {
  validateInput(input);
  const order = await getOrder(input.orderId);
  validateRefundEligibility(order);
  const paymentMode = orderPaymentMode(order);
  const paidAmount = orderPaidAmount(order);
  const refund = await getRefund(input.orderId);
  if (!refund) throw new RefundEngineError("REFUND_NOT_FOUND", "Refund was not found");
  validateRefundAmount(Number(refund.RequestedAmount), paidAmount,
    refund.ApprovedAmount == null ? undefined : Number(refund.ApprovedAmount));
  return { order, refund, paidAmount, paymentMode };
}

async function execute(operation: () => Promise<RefundRecord>): Promise<RefundResponse> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    const failure = error instanceof RefundEngineError
      ? error
      : new RefundEngineError("DATABASE_ERROR", error instanceof Error ? error.message : "Refund operation failed");
    return { ok: false, error: { code: failure.code, message: failure.message } };
  }
}

async function transition(
  input: CommonInput,
  allowed: readonly RefundStatus[],
  nextStatus: RefundStatus,
  stage: RefundJourneyStage,
  refundPatch: Record<string, unknown> = {},
  orderPatch: Record<string, unknown> = {},
): Promise<RefundRecord> {
  const { refund } = await loadContext(input);
  assertStatus(refund, allowed);
  const now = new Date().toISOString();

  return applyTransaction({
    order_id: input.orderId,
    refund_attempt: Number(refund.RefundAttempt),
    expected_refund_status: refund.RefundStatus,
    create_refund: false,
    order_patch: {
      RefundStatus: nextStatus,
      RefundRemarks: input.remarks?.trim() || null,
      RefundBy: input.actor.userName.trim(),
      ...orderPatch,
    },
    refund_patch: {
      RefundStatus: nextStatus,
      RefundRemarks: input.remarks?.trim() || null,
      UpdatedBy: input.actor.userName.trim(),
      UpdatedIP: input.actor.ip?.trim() || null,
      UpdatedDevice: input.actor.device?.trim() || null,
      ...refundPatch,
    },
    journey_patch: buildJourneyPatch(stage, input.actor, input.remarks, now),
  });
}

export async function requestRefund(input: RequestRefundInput): Promise<RefundResponse> {
  return execute(async () => {
    validateInput(input);
    const reason = requiredText(input.reason, "reason");
    const order = await getOrder(input.orderId);
    validateRefundEligibility(order);
    const paymentMode = orderPaymentMode(order);
    const paidAmount = orderPaidAmount(order);
    validateRefundAmount(input.requestedAmount, paidAmount);

    const latestRefund = await getRefund(input.orderId);
    if (isActive(latestRefund)) {
      throw new RefundEngineError("DUPLICATE_REFUND", "Only one active refund is allowed per order");
    }

    const attempt = nextRefundAttempt(latestRefund);
    const reference = buildRefundReference(input.orderId, attempt);
    const now = new Date().toISOString();

    return applyTransaction({
      order_id: input.orderId,
      refund_attempt: attempt,
      expected_refund_status: latestRefund?.RefundStatus ?? null,
      create_refund: true,
      order_patch: {
        RefundStatus: "RefundRequested",
        RefundRequestedAmount: input.requestedAmount,
        RefundApprovedAmount: null,
        RefundReference: reference,
        RefundReason: reason,
        RefundRemarks: input.remarks?.trim() || null,
        RefundRequestedAt: now,
        RefundReviewedAt: null,
        RefundApprovedAt: null,
        RefundProcessingAt: null,
        RefundCompletedAt: null,
        RefundTransactionId: null,
        RefundBy: input.actor.userName.trim(),
        IsRefunded: false,
      },
      refund_patch: {
        RefundReference: reference,
        OrderId: input.orderId,
        RefundAttempt: attempt,
        CustomerId: order.CustomerId ?? null,
        CustomerName: order.CustomerName ?? null,
        CustomerMobile: order.CustomerMobile ?? null,
        RestroCode: order.RestroCode ?? null,
        RestroName: order.RestroName ?? null,
        PaymentMode: paymentMode,
        OrderAmount: paidAmount,
        TrainNo: order.TrainNo ?? null,
        DeliveryDate: order.DeliveryDate ?? null,
        DeliveryTime: order.DeliveryTime ?? null,
        StationCode: order.StationCode ?? null,
        StationName: order.StationName ?? null,
        RequestedAmount: input.requestedAmount,
        ApprovedAmount: null,
        RefundStatus: "RefundRequested",
        RefundReason: reason,
        RefundRemarks: input.remarks?.trim() || null,
        RequestedByUserType: input.actor.userType.trim(),
        RequestedByUserName: input.actor.userName.trim(),
        RequestedSource: input.actor.source.trim(),
        RequestedAt: now,
        CreatedIP: input.actor.ip?.trim() || null,
        UpdatedIP: input.actor.ip?.trim() || null,
        CreatedDevice: input.actor.device?.trim() || null,
        UpdatedDevice: input.actor.device?.trim() || null,
        UpdatedBy: input.actor.userName.trim(),
      },
      journey_patch: buildJourneyPatch("RefundRequested", input.actor, input.remarks, now),
    });
  });
}

export async function reviewRefund(input: ReviewRefundInput): Promise<RefundResponse> {
  const now = new Date().toISOString();
  return execute(() => transition(
    input,
    ["RefundRequested"],
    "RefundUnderReview",
    "RefundUnderReview",
    { ReviewedAt: now, ReviewedBy: input.actor.userName.trim() },
    { RefundReviewedAt: now },
  ));
}

export async function approveRefund(input: ApproveRefundInput): Promise<RefundResponse> {
  return execute(async () => {
    const context = await loadContext(input);
    assertStatus(context.refund, ["RefundUnderReview"]);
    validateRefundAmount(Number(context.refund.RequestedAmount), context.paidAmount, input.approvedAmount);
    if (context.paymentMode === "COD" && input.approveCodManually !== true) {
      throw new RefundEngineError(
        "COD_MANUAL_APPROVAL_REQUIRED",
        "COD refunds require explicit manual approval",
      );
    }
    const now = new Date().toISOString();
    return transition(
      input,
      ["RefundUnderReview"],
      "RefundApproved",
      "RefundApproved",
      { ApprovedAmount: input.approvedAmount, ApprovedAt: now, ApprovedBy: input.actor.userName.trim() },
      { RefundApprovedAmount: input.approvedAmount, RefundApprovedAt: now },
    );
  });
}

export async function rejectRefund(input: RejectRefundInput): Promise<RefundResponse> {
  return execute(async () => {
    const remarks = requiredText(input.remarks, "remarks");
    return transition(
      input,
      ["RefundRequested", "RefundUnderReview"],
      "RefundRejected",
      "RefundUnderReview",
      { FailureReason: remarks },
    );
  });
}

export async function startRefundProcessing(input: StartRefundProcessingInput): Promise<RefundResponse> {
  return execute(async () => {
    const context = await loadContext(input);
    assertStatus(context.refund, ["RefundApproved"]);
    const refundMethod = context.paymentMode === "COD"
      ? requiredText(input.refundMethod, "refundMethod for COD refund")
      : input.refundMethod?.trim() || "ORIGINAL_PAYMENT_METHOD";
    const now = new Date().toISOString();
    return transition(
      input,
      ["RefundApproved"],
      "RefundProcessing",
      "RefundProcessing",
      {
        RefundMethod: refundMethod,
        PaymentProvider: input.paymentProvider?.trim() || null,
        GatewayTransactionId: input.gatewayTransactionId?.trim() || null,
        ProcessingStartedAt: now,
      },
      { RefundProcessingAt: now },
    );
  });
}

export async function completeRefund(input: CompleteRefundInput): Promise<RefundResponse> {
  return execute(async () => {
    const providerRefundId = requiredText(input.providerRefundId, "providerRefundId");
    const now = new Date().toISOString();
    return transition(
      input,
      ["RefundProcessing"],
      "RefundCompleted",
      "RefundCompleted",
      {
        ProviderRefundId: providerRefundId,
        CompletedAt: now,
        CompletedBy: input.actor.userName.trim(),
      },
      {
        RefundCompletedAt: now,
        RefundTransactionId: providerRefundId,
        IsRefunded: true,
      },
    );
  });
}
