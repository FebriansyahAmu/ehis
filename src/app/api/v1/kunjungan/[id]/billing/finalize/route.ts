// REST: finalisasi tagihan (Slice 2f — lifecycle beku).
//   POST /api/v1/kunjungan/:id/billing/finalize  { force?, expectedVersion? }
// RBAC: billing.invoice:update (staf billing, lintas-unit; scopeKunjungan default false).
// Bekukan charge proyeksi → snapshot billing.InvoiceItem; Draft → Final. Aksi BILLING,
// bukan dipicu discharge klinis. untariffed > 0 ditolak (422) kecuali force.

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { InvoiceFinalizeInput } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const POST = route({
  resource: "billing.invoice",
  action: "update",
  params: IdParam,
  body: InvoiceFinalizeInput,
  handler: ({ params, body, actor }) => billingInvoiceService.finalizeInvoice(params.id, body, actor),
});
