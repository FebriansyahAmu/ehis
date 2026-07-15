// REST: ringkasan pembayaran (Dashboard Kasir).
//   GET /api/v1/billing/payments/summary?shiftId=&date= → agregat byMetode/transaksi/refund.
// RBAC: billing.kasir:read. Sumber = billing.payment non-void (real).

import { route } from "@/lib/http/route";
import { PaymentSummaryQuery } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const GET = route({
  resource: "billing.kasir",
  action: "read",
  query: PaymentSummaryQuery,
  handler: ({ query }) => billingInvoiceService.paymentSummary(query.shiftId, query.date),
});
