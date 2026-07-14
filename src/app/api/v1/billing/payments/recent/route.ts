// REST: pembayaran terbaru (feed Kasir Quick Bayar).
//   GET /api/v1/billing/payments/recent?shiftId=&limit= → pembayaran non-void terbaru.
// RBAC: billing.kasir:read (staf kasir). Pasien di-resolve dari header kunjungan (Service).

import { route } from "@/lib/http/route";
import { RecentPaymentsQuery } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const GET = route({
  resource: "billing.kasir",
  action: "read",
  query: RecentPaymentsQuery,
  handler: ({ query }) => billingInvoiceService.listRecentPayments(query.shiftId, query.limit),
});
