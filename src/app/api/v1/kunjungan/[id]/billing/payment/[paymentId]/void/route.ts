// REST: void 1 pembayaran (bukan delete, Slice 2a).
//   POST /api/v1/kunjungan/:id/billing/payment/:paymentId/void  { alasan }
// RBAC: billing.kasir:create (aksi kas). voidedBy di-resolve server (actor, anti-spoof).

import { route } from "@/lib/http/route";
import { PaymentParam, VoidPaymentInput } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const POST = route({
  resource: "billing.kasir",
  action: "create",
  params: PaymentParam,
  body: VoidPaymentInput,
  handler: ({ params, body, actor }) =>
    billingInvoiceService.voidPayment(params.id, params.paymentId, body.alasan, actor),
});
