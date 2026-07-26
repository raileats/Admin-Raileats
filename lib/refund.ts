import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TABLES = {
  orders: "Orders",
  orderRefunds: "OrderRefunds",
  orderJourney: "OrderJourney",
} as const;

const ACTIVE_REFUND_STATUSES = [
  "Pending",
  "Approved",
  "Processing",
] as const;

const RETRYABLE_REFUND_STATUSES = ["Failed"] as const;

type DbRefundStatus =
  | "Pending"
  | "Approved"
  | "Processing"
  | "Success"
  | "Failed";

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
  ip?: string | null;
  device?: string | null;
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

export type ReviewRefundInput = CommonInput;

export interface ApproveRefundInput extends CommonInput {
  approvedAmount: number;
  approveCodManually?: boolean;
}

export interface RejectRefundInput extends CommonInput {
  remarks: string;
}

export interface StartRefundProcessingInput extends CommonInput {
  refundMethod?: string;
  PaymentGateway?: string;
  gatewayTransactionId?: string;
}

export interface CompleteRefundInput extends CommonInput {
  providerRefundId?: string;
  manualTransactionId?: string;
}

interface DbOrder extends Record<string, unknown> {
  OrderId: string;

  OrderStatus?: string | null;
  OrderSubStatus?: string | null;

  Status?: string | null;
  SubStatus?: string | null;

  TrainNo?: string | null;
  TrainNumber?: string | null;

  PaymentMode?: string | null;
  PaymentMethod?: string | null;

  PPDAmount?: number | string | null;
  CODAmount?: number | string | null;
  PaidAmount?: number | string | null;
  AmountPaid?: number | string | null;
  TotalPaidAmount?: number | string | null;
  TotalAmount?: number | string | null;
  OrderAmount?: number | string | null;

  CustomerId?: string | null;
  CustomerName?: string | null;
  CustomerMobile?: string | null;

  RestroCode?: number | string | null;
  RestroName?: string | null;

  DeliveryDate?: string | null;
  DeliveryTime?: string | null;

  StationCode?: string | null;
  StationName?: string | null;
}

interface DbRefund extends Record<string, unknown> {
  RefundId: number | string;
  RefundNo: string;
  OrderId: string;
  RefundAttempt: number | string;
  RefundStatus: DbRefundStatus;
  PaymentMode?: string | null;
  RefundAmount: number | string;
  ApprovedAmount?: number | string | null;
  RefundReason: string;
  AdminRemarks?: string | null;
  RequestedAt: string;
  ReviewedAt?: string | null;
  ApprovedAt?: string | null;
  ProcessingStartedAt?: string | null;
  CompletedAt?: string | null;
  UpdatedAt: string;
}

interface DbOrderJourney extends Record<string, unknown> {
  OrderId: string;
}

interface ValidatedActor {
  userType: string;
  userName: string;
  source: string;
  ip: string | null;
  device: string | null;
}

interface RefundContext {
  actor: ValidatedActor;
  order: DbOrder;
  refund: DbRefund;
  paymentMode: PaymentMode;
  paidAmount: number;
}

interface ISTDateTime {
  iso: string;
  date: string;
  time: string;
}

interface SequentialMutation {
  orderId: string;
  refundBefore: DbRefund | null;
  createRefund: boolean;
  expectedRefundStatus: DbRefundStatus | null;
  refundPatch: Record<string, unknown>;
  orderPatch: Record<string, unknown>;
  journeyPatch: Record<string, unknown>;
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
    global: {
      headers: {
        "X-RailEats-Client": "refund-engine",
      },
    },
  });

  return serviceRoleClient;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .replace(/[\s_-]+/g, "")
    .toUpperCase();
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new RefundEngineError("INVALID_ARGUMENT", `${field} is required`);
  }
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validateOrderId(value: unknown): string {
  const orderId = requiredText(value, "orderId");
  if (!orderId.toUpperCase().startsWith("RE-") || orderId.length > 100) {
    throw new RefundEngineError(
      "INVALID_ARGUMENT",
      "orderId must start with RE- and contain at most 100 characters",
    );
  }
  return orderId;
}

function validateActor(actor: RefundActor | null | undefined): ValidatedActor {
  if (!actor || typeof actor !== "object") {
    throw new RefundEngineError("INVALID_ARGUMENT", "actor is required");
  }

  return {
    userType: requiredText(actor.userType, "actor.userType"),
    userName: requiredText(actor.userName, "actor.userName"),
    source: requiredText(actor.source, "actor.source"),
    ip: optionalText(actor.ip),
    device: optionalText(actor.device),
  };
}

function validateCommonInput(input: CommonInput | null | undefined): {
  orderId: string;
  actor: ValidatedActor;
} {
  if (!input || typeof input !== "object") {
    throw new RefundEngineError("INVALID_ARGUMENT", "input is required");
  }

  return {
    orderId: validateOrderId(input.orderId),
    actor: validateActor(input.actor),
  };
}

function numericValue(value: unknown, field: string): number {
  if (value === null || value === undefined || value === "") {
    throw new RefundEngineError("INVALID_AMOUNT", `${field} is not available`);
  }

  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    throw new RefundEngineError("INVALID_AMOUNT", `${field} is not a valid amount`);
  }

  return amount;
}

function firstDefinedAmount(
  order: DbOrder,
  fields: ReadonlyArray<keyof DbOrder>,
): { amount: number; field: string } {
  for (const field of fields) {
    const value = order[field];
    if (value !== null && value !== undefined && value !== "") {
      return {
        amount: numericValue(value, String(field)),
        field: String(field),
      };
    }
  }

  throw new RefundEngineError(
    "INVALID_AMOUNT",
    `Order has no paid amount in any supported field: ${fields.join(", ")}`,
  );
}

function getPaymentMode(order: DbOrder): PaymentMode {
  const mode = normalize(order.PaymentMode ?? order.PaymentMethod);

  if (mode === "COD" || mode === "CASHONDELIVERY") {
    return "COD";
  }

  if (
    mode === "PREPAID" ||
    mode === "PPD" ||
    mode === "ONLINE" ||
    mode === "UPI" ||
    mode === "CARD" ||
    mode === "NETBANKING" ||
    mode === "WALLET"
  ) {
    return "PREPAID";
  }

  throw new RefundEngineError(
    "UNSUPPORTED_PAYMENT_MODE",
    "PaymentMode must be COD, CASH ON DELIVERY, PREPAID, PPD, ONLINE, UPI, CARD, NETBANKING, or WALLET",
  );
}

function getPaidAmount(order: DbOrder, paymentMode: PaymentMode): number {
  const fields: ReadonlyArray<keyof DbOrder> =
    paymentMode === "PREPAID"
      ? [
          "PPDAmount",
          "PaidAmount",
          "AmountPaid",
          "TotalPaidAmount",
          "TotalAmount",
          "OrderAmount",
        ]
      : ["CODAmount", "TotalAmount", "OrderAmount"];

  const { amount, field } = firstDefinedAmount(order, fields);
  if (amount < 0) {
    throw new RefundEngineError("INVALID_AMOUNT", `${field} cannot be negative`);
  }

  return amount;
}

async function getOrder(orderId: string): Promise<DbOrder> {
  const { data, error } = await supabase()
    .from(TABLES.orders)
    .select("*")
    .eq("OrderId", orderId)
    .maybeSingle();

  if (error) throw toDatabaseError(error);
  if (!data) {
    throw new RefundEngineError("ORDER_NOT_FOUND", `Order ${orderId} was not found`);
  }

  return data as DbOrder;
}

async function getRefund(orderId: string): Promise<DbRefund | null> {
  const { data, error } = await supabase()
    .from(TABLES.orderRefunds)
    .select("*")
    .eq("OrderId", orderId)
    .order("RefundAttempt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw toDatabaseError(error);
  return data as DbRefund | null;
}

async function getActiveRefund(orderId: string): Promise<DbRefund | null> {
  const { data, error } = await supabase()
    .from(TABLES.orderRefunds)
    .select("*")
    .eq("OrderId", orderId)
    .in("RefundStatus", [...ACTIVE_REFUND_STATUSES])
    .order("RefundAttempt", { ascending: false })
    .limit(2);

  if (error) throw toDatabaseError(error);
  const refunds = (data ?? []) as DbRefund[];
  if (refunds.length > 1) {
    throw new RefundEngineError(
      "DUPLICATE_REFUND",
      "More than one active refund exists for this order",
    );
  }
  return refunds[0] ?? null;
}

async function getOrderJourney(
  orderId: string,
): Promise<DbOrderJourney | null> {
  const { data, error } = await supabase()
    .from(TABLES.orderJourney)
    .select("*")
    .eq("OrderId", orderId)
    .maybeSingle();

  if (error) throw toDatabaseError(error);

  // Older orders may not have an OrderJourney row. Refund creation must not
  // fail only because the optional journey/audit row is missing.
  return (data as DbOrderJourney | null) ?? null;
}

function validateRefundEligibility(order: DbOrder): void {
  const status = normalize(order.OrderStatus ?? order.Status);
  if (
    status !== "DELIVERED" &&
    status !== "BADDELIVERY" &&
    status !== "PARTIALDELIVERY"
  ) {
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
    throw new RefundEngineError(
      "INVALID_AMOUNT",
      "RefundAmount must be greater than zero",
    );
  }

  if (requestedAmount > paidAmount) {
    throw new RefundEngineError(
      "AMOUNT_EXCEEDS_PAID_AMOUNT",
      "RefundAmount cannot exceed the paid amount",
    );
  }

  if (approvedAmount !== undefined) {
    if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
      throw new RefundEngineError(
        "INVALID_AMOUNT",
        "ApprovedAmount must be greater than zero",
      );
    }

    if (approvedAmount > requestedAmount || approvedAmount > paidAmount) {
      throw new RefundEngineError(
        "AMOUNT_EXCEEDS_PAID_AMOUNT",
        "ApprovedAmount cannot exceed RefundAmount or the paid amount",
      );
    }
  }
}

function nextRefundAttempt(latestRefund: DbRefund | null): number {
  if (!latestRefund) return 1;

  if (latestRefund.RefundStatus === "Success") {
    throw new RefundEngineError(
      "DUPLICATE_REFUND",
      "A new refund attempt is not allowed after RefundCompleted",
    );
  }

  if (
    ACTIVE_REFUND_STATUSES.includes(
      latestRefund.RefundStatus as (typeof ACTIVE_REFUND_STATUSES)[number],
    )
  ) {
    throw new RefundEngineError(
      "DUPLICATE_REFUND",
      "Only one active refund is allowed per order",
    );
  }

  if (
    !RETRYABLE_REFUND_STATUSES.includes(
      latestRefund.RefundStatus as (typeof RETRYABLE_REFUND_STATUSES)[number],
    )
  ) {
    throw new RefundEngineError(
      "INVALID_REFUND_STATE",
      `A new attempt is not allowed after ${latestRefund.RefundStatus}`,
    );
  }

  const currentAttempt = Number(latestRefund.RefundAttempt);
  if (!Number.isSafeInteger(currentAttempt) || currentAttempt < 1) {
    throw new RefundEngineError(
      "DATABASE_ERROR",
      "Stored RefundAttempt is invalid",
    );
  }

  return currentAttempt + 1;
}

function getCurrentISTDateTime(): ISTDateTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const date = `${values.year}-${values.month}-${values.day}`;
  const time = `${values.hour}:${values.minute}:${values.second}`;

  return {
    iso: `${date}T${time}+05:30`,
    date,
    time,
  };
}

function buildJourneyPatch(
  status: RefundStatus,
  actor: ValidatedActor,
  remarks: string | undefined,
  currentTime: ISTDateTime,
  stage?: RefundJourneyStage,
): Record<string, unknown> {
  const effectiveRemarks = optionalText(remarks) ?? status;
  const patch: Record<string, unknown> = {};

  if (stage) {
    Object.assign(patch, {
      [`${stage}Update`]: status,
      [`${stage}Remarks`]: effectiveRemarks,
      [`${stage}UserType`]: actor.userType,
      [`${stage}UserName`]: actor.userName,
      [`${stage}Source`]: actor.source,
      [`${stage}ActionAtDate`]: currentTime.date,
      [`${stage}ActionAtTime`]: currentTime.time,
    });
  }

  return patch;
}

function assertRefundStatus(
  refund: DbRefund,
  allowedStatuses: readonly RefundStatus[],
): void {
  const currentStatus = publicRefundStatus(refund);
  if (!allowedStatuses.includes(currentStatus)) {
    throw new RefundEngineError(
      "INVALID_REFUND_STATE",
      `Refund is ${currentStatus}; expected ${allowedStatuses.join(" or ")}`,
    );
  }
}

function databaseRefundStatus(status: RefundStatus): DbRefundStatus {
  switch (status) {
    case "RefundRequested":
    case "RefundUnderReview":
      return "Pending";
    case "RefundApproved":
      return "Approved";
    case "RefundProcessing":
      return "Processing";
    case "RefundCompleted":
      return "Success";
    case "RefundRejected":
    case "RefundFailed":
    case "RefundCancelled":
      return "Failed";
    default:
      throw new RefundEngineError(
        "INVALID_REFUND_STATE",
        `${status} cannot be stored as a refund status`,
      );
  }
}

function publicRefundStatus(refund: DbRefund): RefundStatus {
  switch (refund.RefundStatus) {
    case "Pending":
      return refund.ReviewedAt ? "RefundUnderReview" : "RefundRequested";
    case "Approved":
      return "RefundApproved";
    case "Processing":
      return "RefundProcessing";
    case "Success":
      return "RefundCompleted";
    case "Failed":
      return "RefundRejected";
  }
}

function snapshotPatch(
  row: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.keys(patch).map((key) => [key, row[key] ?? null]),
  );
}

function toDatabaseError(error: {
  code?: string;
  message: string;
}): RefundEngineError {
  if (error.code === "23505") {
    return new RefundEngineError(
      "DUPLICATE_REFUND",
      "A conflicting refund attempt or reference already exists",
      error.code,
    );
  }

  if (error.code === "40001" || error.code === "P0002") {
    return new RefundEngineError(
      "CONCURRENT_UPDATE",
      "Refund state changed concurrently",
      error.code,
    );
  }

  return new RefundEngineError("DATABASE_ERROR", error.message, error.code);
}

async function rollbackRefund(
  refundBefore: DbRefund | null,
  refundAfter: DbRefund,
  createRefund: boolean,
  originalPatch: Record<string, unknown>,
): Promise<string | null> {
  if (createRefund) {
    const { error } = await supabase()
      .from(TABLES.orderRefunds)
      .delete()
      .eq("RefundId", refundAfter.RefundId)
      .eq("RefundNo", refundAfter.RefundNo);

    return error ? `Refund rollback failed: ${error.message}` : null;
  }

  if (!refundBefore) return "Refund rollback failed: previous refund snapshot is missing";

  const { error } = await supabase()
    .from(TABLES.orderRefunds)
    .update(snapshotPatch(refundBefore, originalPatch))
    .eq("RefundId", refundBefore.RefundId)
    .eq("RefundStatus", refundAfter.RefundStatus);

  return error ? `Refund rollback failed: ${error.message}` : null;
}

async function applySequentialMutation(
  mutation: SequentialMutation,
): Promise<RefundRecord> {
  const orderBefore = await getOrder(mutation.orderId);
  const existingJourney = await getOrderJourney(mutation.orderId);

  let refundAfter: DbRefund;

  if (mutation.createRefund) {
    const { data, error } = await supabase()
      .from(TABLES.orderRefunds)
      .insert(mutation.refundPatch)
      .select("*")
      .single();

    if (error) throw toDatabaseError(error);
    refundAfter = data as DbRefund;
  } else {
    if (!mutation.refundBefore || !mutation.expectedRefundStatus) {
      throw new RefundEngineError(
        "DATABASE_ERROR",
        "Refund update is missing its previous state",
      );
    }

    const { data, error } = await supabase()
      .from(TABLES.orderRefunds)
      .update(mutation.refundPatch)
      .eq("RefundId", mutation.refundBefore.RefundId)
      .eq("RefundStatus", mutation.expectedRefundStatus)
      .select("*")
      .maybeSingle();

    if (error) throw toDatabaseError(error);
    if (!data) {
      throw new RefundEngineError(
        "CONCURRENT_UPDATE",
        "Refund state changed before the update could be applied",
      );
    }
    refundAfter = data as DbRefund;
  }

  const effectiveOrderPatch = mutation.createRefund
    ? {
        ...mutation.orderPatch,
        RefundReference: refundAfter.RefundNo,
      }
    : mutation.orderPatch;
  const orderBeforePatch = snapshotPatch(orderBefore, effectiveOrderPatch);
  const { data: orderAfter, error: orderError } = await supabase()
    .from(TABLES.orders)
    .update(effectiveOrderPatch)
    .eq("OrderId", mutation.orderId)
    .select("OrderId")
    .maybeSingle();

  if (orderError || !orderAfter) {
    const rollbackError = await rollbackRefund(
      mutation.refundBefore,
      refundAfter,
      mutation.createRefund,
      mutation.refundPatch,
    );
    const reason = orderError?.message ?? "Order disappeared during refund update";
    throw new RefundEngineError(
      "DATABASE_ERROR",
      `Orders update failed: ${reason}${rollbackError ? `; ${rollbackError}` : "; refund change was rolled back"}`,
    );
  }

  // Keep the original delivery status/sub-status unchanged. Only update the
  // journey/audit record when one already exists. Older imported orders may
  // legitimately have no OrderJourney row.
  if (existingJourney && Object.keys(mutation.journeyPatch).length > 0) {
    const { data: journeyAfter, error: journeyError } = await supabase()
      .from(TABLES.orderJourney)
      .update(mutation.journeyPatch)
      .eq("OrderId", mutation.orderId)
      .select("OrderId")
      .maybeSingle();

    if (journeyError || !journeyAfter) {
      const compensationErrors: string[] = [];

      const { error: orderRollbackError } = await supabase()
        .from(TABLES.orders)
        .update(orderBeforePatch)
        .eq("OrderId", mutation.orderId);
      if (orderRollbackError) {
        compensationErrors.push(
          `Orders rollback failed: ${orderRollbackError.message}`,
        );
      }

      const refundRollbackError = await rollbackRefund(
        mutation.refundBefore,
        refundAfter,
        mutation.createRefund,
        mutation.refundPatch,
      );
      if (refundRollbackError) compensationErrors.push(refundRollbackError);

      const reason =
        journeyError?.message ?? "OrderJourney disappeared during refund update";
      throw new RefundEngineError(
        "DATABASE_ERROR",
        `OrderJourney update failed: ${reason}; ${
          compensationErrors.length
            ? compensationErrors.join("; ")
            : "Orders and refund changes were rolled back"
        }`,
      );
    }
  }

  return mapRefund(refundAfter);
}

function mapRefund(row: DbRefund): RefundRecord {
  const paymentMode = normalize(row.PaymentMode);
  if (paymentMode !== "COD" && paymentMode !== "PREPAID") {
    throw new RefundEngineError(
      "DATABASE_ERROR",
      `Stored refund PaymentMode is invalid: ${String(row.PaymentMode ?? "")}`,
    );
  }

  return {
    refundId: String(row.RefundId),
    refundReference: row.RefundNo,
    orderId: row.OrderId,
    refundAttempt: Number(row.RefundAttempt),
    status: publicRefundStatus(row),
    paymentMode,
    requestedAmount: Number(row.RefundAmount),
    approvedAmount:
      row.ApprovedAmount === null || row.ApprovedAmount === undefined
        ? null
        : Number(row.ApprovedAmount),
    reason: row.RefundReason,
    remarks: row.AdminRemarks ?? null,
    requestedAt: row.RequestedAt,
    reviewedAt: row.ReviewedAt ?? null,
    approvedAt: row.ApprovedAt ?? null,
    processingStartedAt: row.ProcessingStartedAt ?? null,
    completedAt: row.CompletedAt ?? null,
    updatedAt: row.UpdatedAt,
  };
}

async function loadContext(input: CommonInput): Promise<RefundContext> {
  const validated = validateCommonInput(input);
  const order = await getOrder(validated.orderId);
  validateRefundEligibility(order);

  const paymentMode = getPaymentMode(order);
  const paidAmount = getPaidAmount(order, paymentMode);
  const refund = await getRefund(validated.orderId);

  if (!refund) {
    throw new RefundEngineError("REFUND_NOT_FOUND", "Refund was not found");
  }

  const activeRefund = await getActiveRefund(validated.orderId);
  if (activeRefund && activeRefund.RefundId !== refund.RefundId) {
    throw new RefundEngineError(
      "DUPLICATE_REFUND",
      "More than one current refund record exists for this order",
    );
  }

  validateRefundAmount(
    numericValue(refund.RefundAmount, "RefundAmount"),
    paidAmount,
    refund.ApprovedAmount === null || refund.ApprovedAmount === undefined
      ? undefined
      : numericValue(refund.ApprovedAmount, "ApprovedAmount"),
  );

  return {
    actor: validated.actor,
    order,
    refund,
    paymentMode,
    paidAmount,
  };
}

async function execute(
  operation: () => Promise<RefundRecord>,
): Promise<RefundResponse> {
  try {
    return {
      ok: true,
      data: await operation(),
    };
  } catch (error) {
    const failure =
      error instanceof RefundEngineError
        ? error
        : new RefundEngineError(
            "DATABASE_ERROR",
            error instanceof Error ? error.message : "Refund operation failed",
          );

    return {
      ok: false,
      error: {
        code: failure.code,
        message: failure.message,
      },
    };
  }
}

async function transitionRefund(
  input: CommonInput,
  allowedStatuses: readonly RefundStatus[],
  nextStatus: RefundStatus,
  refundPatch: Record<string, unknown>,
  orderPatch: Record<string, unknown>,
  stage?: RefundJourneyStage,
): Promise<RefundRecord> {
  const context = await loadContext(input);
  assertRefundStatus(context.refund, allowedStatuses);
  const currentTime = getCurrentISTDateTime();
  const remarks = optionalText(input.remarks) ?? nextStatus;

  return applySequentialMutation({
    orderId: context.order.OrderId,
    refundBefore: context.refund,
    createRefund: false,
    expectedRefundStatus: context.refund.RefundStatus,
    refundPatch: {
      RefundStatus: databaseRefundStatus(nextStatus),
      AdminRemarks: remarks,
      UpdatedBy: context.actor.userName,
      UpdatedIP: context.actor.ip,
      UpdatedDevice: context.actor.device,
      ...refundPatch,
    },
    orderPatch: {
      RefundStatus: nextStatus,
      RefundRemarks: remarks,
      RefundBy: context.actor.userName,
      ...orderPatch,
    },
    journeyPatch: buildJourneyPatch(
      nextStatus,
      context.actor,
      remarks,
      currentTime,
      stage,
    ),
  });
}

export async function requestRefund(
  input: RequestRefundInput,
): Promise<RefundResponse> {
  return execute(async () => {
    const validated = validateCommonInput(input);
    const reason = requiredText(input.reason, "reason");
    const order = await getOrder(validated.orderId);
    validateRefundEligibility(order);

    const paymentMode = getPaymentMode(order);
    const paidAmount = getPaidAmount(order, paymentMode);
    validateRefundAmount(input.requestedAmount, paidAmount);

    const activeRefund = await getActiveRefund(validated.orderId);
    if (activeRefund) {
      throw new RefundEngineError(
        "DUPLICATE_REFUND",
        "Only one active refund is allowed per order",
      );
    }

    const latestRefund = await getRefund(validated.orderId);
    const attempt = nextRefundAttempt(latestRefund);
    const currentTime = getCurrentISTDateTime();
    const remarks = optionalText(input.remarks) ?? reason;

    return applySequentialMutation({
      orderId: validated.orderId,
      refundBefore: latestRefund,
      createRefund: true,
      expectedRefundStatus: latestRefund?.RefundStatus ?? null,
      refundPatch: {
        OrderId: validated.orderId,
        RefundAttempt: attempt,
        CustomerId: order.CustomerId ?? null,
        CustomerName: order.CustomerName ?? null,
        CustomerMobile: order.CustomerMobile ?? null,
        RestroCode: order.RestroCode ?? null,
        RestroName: order.RestroName ?? null,
        PaymentMode: paymentMode,
        PaidAmount: paidAmount,

        TrainNo:
  order.TrainNumber ??
  order.TrainNo ??
  null,

DeliveryDate: order.DeliveryDate ?? null,
DeliveryTime: order.DeliveryTime ?? null,

StationCode: order.StationCode ?? null,
StationName: order.StationName ?? null,

OrderStatus:
  order.Status ??
  order.OrderStatus ??
  "Delivered",

OrderSubStatus:
  order.SubStatus ??
  order.OrderSubStatus ??
  order.Status ??
  order.OrderStatus ??
  "Delivered",
        RefundAmount: input.requestedAmount,
        ApprovedAmount: null,
        RefundStatus: "Pending",
        RefundReason: reason,
        AdminRemarks: remarks,
        RequestedByType: validated.actor.userType,
        RequestedByName: validated.actor.userName,
        RequestedSource: validated.actor.source,
        RequestedAt: currentTime.iso,
        RequestedIp: validated.actor.ip,
        UpdatedIP: validated.actor.ip,
        RequestedDevice: validated.actor.device,
        UpdatedDevice: validated.actor.device,
        UpdatedBy: validated.actor.userName,
      },
      orderPatch: {
        RefundStatus: "RefundRequested",
        RefundRequestedAmount: input.requestedAmount,
        RefundApprovedAmount: null,
        RefundReason: reason,
        RefundRemarks: remarks,
        RefundRequestedAt: currentTime.iso,
        RefundReviewedAt: null,
        RefundApprovedAt: null,
        RefundProcessingAt: null,
        RefundCompletedAt: null,
        RefundTransactionId: null,
        RefundBy: validated.actor.userName,
        IsRefunded: false,
      },
      journeyPatch: buildJourneyPatch(
        "RefundRequested",
        validated.actor,
        remarks,
        currentTime,
        "RefundRequested",
      ),
    });
  });
}

export async function reviewRefund(
  input: ReviewRefundInput,
): Promise<RefundResponse> {
  return execute(async () => {
    const validated = validateCommonInput(input);
    const currentTime = getCurrentISTDateTime();

    return transitionRefund(
      { ...input, orderId: validated.orderId, actor: validated.actor },
      ["RefundRequested"],
      "RefundUnderReview",
      {
        ReviewedAt: currentTime.iso,
        ReviewedBy: validated.actor.userName,
      },
      {
        RefundReviewedAt: currentTime.iso,
      },
      "RefundUnderReview",
    );
  });
}

export async function approveRefund(
  input: ApproveRefundInput,
): Promise<RefundResponse> {
  return execute(async () => {
    const context = await loadContext(input);
    assertRefundStatus(context.refund, ["RefundUnderReview"]);

    validateRefundAmount(
      numericValue(context.refund.RefundAmount, "RefundAmount"),
      context.paidAmount,
      input.approvedAmount,
    );

    if (context.paymentMode === "COD" && input.approveCodManually !== true) {
      throw new RefundEngineError(
        "COD_MANUAL_APPROVAL_REQUIRED",
        "COD refunds require explicit manual approval",
      );
    }

    const currentTime = getCurrentISTDateTime();
    const remarks = optionalText(input.remarks) ?? "RefundApproved";

    return applySequentialMutation({
      orderId: context.order.OrderId,
      refundBefore: context.refund,
      createRefund: false,
      expectedRefundStatus: "Pending",
      refundPatch: {
        RefundStatus: "Approved",
        ApprovedAmount: input.approvedAmount,
        ApprovedAt: currentTime.iso,
        ApprovedBy: context.actor.userName,
        AdminRemarks: remarks,
        UpdatedBy: context.actor.userName,
        UpdatedIP: context.actor.ip,
        UpdatedDevice: context.actor.device,
      },
      orderPatch: {
        RefundStatus: "RefundApproved",
        RefundApprovedAmount: input.approvedAmount,
        RefundApprovedAt: currentTime.iso,
        RefundRemarks: remarks,
        RefundBy: context.actor.userName,
      },
      journeyPatch: buildJourneyPatch(
        "RefundApproved",
        context.actor,
        remarks,
        currentTime,
        "RefundApproved",
      ),
    });
  });
}

export async function rejectRefund(
  input: RejectRefundInput,
): Promise<RefundResponse> {
  return execute(async () => {
    const context = await loadContext(input);
    assertRefundStatus(context.refund, [
      "RefundRequested",
      "RefundUnderReview",
    ]);
    const rejectionReason = requiredText(input.remarks, "remarks");
    const currentTime = getCurrentISTDateTime();

    return applySequentialMutation({
      orderId: context.order.OrderId,
      refundBefore: context.refund,
      createRefund: false,
      expectedRefundStatus: context.refund.RefundStatus,
      refundPatch: {
        RefundStatus: "Failed",
        AdminRemarks: rejectionReason,
        FailureReason: rejectionReason,
        FailedAt: currentTime.iso,
        UpdatedBy: context.actor.userName,
        UpdatedIP: context.actor.ip,
        UpdatedDevice: context.actor.device,
      },
      orderPatch: {
        RefundStatus: "RefundRejected",
        RefundRemarks: rejectionReason,
        RefundBy: context.actor.userName,
      },
      journeyPatch: buildJourneyPatch(
        "RefundRejected",
        context.actor,
        rejectionReason,
        currentTime,
      ),
    });
  });
}

export async function startRefundProcessing(
  input: StartRefundProcessingInput,
): Promise<RefundResponse> {
  return execute(async () => {
    const context = await loadContext(input);
    assertRefundStatus(context.refund, ["RefundApproved"]);

    const refundMethod =
      context.paymentMode === "COD"
        ? requiredText(input.refundMethod, "refundMethod")
        : optionalText(input.refundMethod) ?? "ORIGINAL_PAYMENT_METHOD";

    const currentTime = getCurrentISTDateTime();
    const remarks = optionalText(input.remarks) ?? "RefundProcessing";

    return applySequentialMutation({
      orderId: context.order.OrderId,
      refundBefore: context.refund,
      createRefund: false,
      expectedRefundStatus: "Approved",
      refundPatch: {
        RefundStatus: "Processing",
        RefundMethod: refundMethod,
        PaymentGateway: optionalText(input.PaymentGateway),
        GatewayTransactionId: optionalText(input.gatewayTransactionId),
        ProcessingStartedAt: currentTime.iso,
        AdminRemarks: remarks,
        UpdatedBy: context.actor.userName,
        UpdatedIP: context.actor.ip,
        UpdatedDevice: context.actor.device,
      },
      orderPatch: {
        RefundStatus: "RefundProcessing",
        RefundProcessingAt: currentTime.iso,
        RefundRemarks: remarks,
        RefundBy: context.actor.userName,
      },
      journeyPatch: buildJourneyPatch(
        "RefundProcessing",
        context.actor,
        remarks,
        currentTime,
        "RefundProcessing",
      ),
    });
  });
}

export async function completeRefund(
  input: CompleteRefundInput,
): Promise<RefundResponse> {
  return execute(async () => {
    const context = await loadContext(input);
    assertRefundStatus(context.refund, ["RefundProcessing"]);

    const transactionId =
      context.paymentMode === "PREPAID"
        ? requiredText(input.providerRefundId, "providerRefundId")
        : requiredText(
            input.manualTransactionId ?? input.providerRefundId,
            "manualTransactionId",
          );

    const currentTime = getCurrentISTDateTime();
    const remarks = optionalText(input.remarks) ?? "RefundCompleted";

    return applySequentialMutation({
      orderId: context.order.OrderId,
      refundBefore: context.refund,
      createRefund: false,
      expectedRefundStatus: "Processing",
      refundPatch: {
        RefundStatus: "Success",
        GatewayRefundId:
          context.paymentMode === "PREPAID"
            ? transactionId
            : optionalText(input.providerRefundId),
        GatewayTransactionId:
          context.paymentMode === "COD" ? transactionId : context.refund.GatewayTransactionId ?? null,
        CompletedAt: currentTime.iso,
        CompletedBy: context.actor.userName,
        AdminRemarks: remarks,
        UpdatedBy: context.actor.userName,
        UpdatedIP: context.actor.ip,
        UpdatedDevice: context.actor.device,
      },
      orderPatch: {
        IsRefunded: true,
        RefundStatus: "RefundCompleted",
        RefundCompletedAt: currentTime.iso,
        RefundTransactionId: transactionId,
        RefundRemarks: remarks,
        RefundBy: context.actor.userName,
      },
      journeyPatch: buildJourneyPatch(
        "RefundCompleted",
        context.actor,
        remarks,
        currentTime,
        "RefundCompleted",
      ),
    });
  });
}
