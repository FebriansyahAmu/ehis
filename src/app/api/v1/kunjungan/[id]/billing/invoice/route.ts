// REST: state invoice 1 kunjungan (Slice 2a) — proyeksi charge + invoice + payment + total/sisa.
//   GET /api/v1/kunjungan/:id/billing/invoice
// RBAC: billing.invoice:read (staf billing/kasir, lintas-unit; scopeKunjungan default false).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const GET = route({
  resource: "billing.invoice",
  action: "read",
  params: IdParam,
  handler: ({ params }) => billingInvoiceService.getInvoiceState(params.id),
});
