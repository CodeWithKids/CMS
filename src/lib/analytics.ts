export type AppEventName =
  | "session_expense_submitted"
  | "invoice_payment_recorded"
  | "invoice_discount_requested"
  | "invoice_refund_requested";

export interface AppEventPayload {
  [key: string]: unknown;
}

export function logAppEvent(name: AppEventName, payload: AppEventPayload = {}) {
  // Lightweight hook for plugging in real analytics later.
  // For now we just log to the console in a structured way.
  if (import.meta.env.MODE === "test") return;
  // eslint-disable-next-line no-console
  console.info("[AppEvent]", name, payload);
}

