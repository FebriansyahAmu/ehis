// REST: batalkan finalisasi tagihan (Slice 2f — reopen).
//   POST /api/v1/kunjungan/:id/billing/reopen  { alasan, expectedVersion? }
// RBAC: billing.invoice:update (staf billing). Buang snapshot InvoiceItem → charge kembali
// proyeksi hidup (Final → Draft). Pembayaran DIPERTAHANKAN. Alasan wajib (intent audit).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { InvoiceReopenInput } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const POST = route({
  resource: "billing.invoice",
  action: "update",
  params: IdParam,
  body: InvoiceReopenInput,
  handler: ({ params, body, actor }) => billingInvoiceService.reopenInvoice(params.id, body, actor),
});
