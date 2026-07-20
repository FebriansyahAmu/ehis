// REST: riwayat audit tagihan (Slice 2g).
//   GET /api/v1/kunjungan/:id/billing/audit  → AuditEventDTO[] (terbaru dulu)
// RBAC: billing.invoice:read (staf billing, lintas-unit; scopeKunjungan default false).
// Jejak immutable mutasi finansial invoice (finalize/reopen/adjustment/payment/void/create).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const GET = route({
  resource: "billing.invoice",
  action: "read",
  params: IdParam,
  handler: ({ params }) => billingInvoiceService.listAudit(params.id),
});
