// REST: pembayaran 1 kunjungan (Kasir = satu pintu, Slice 2a).
//   GET  /api/v1/kunjungan/:id/billing/payment → daftar pembayaran
//   POST /api/v1/kunjungan/:id/billing/payment → catat pembayaran (resolve-or-create invoice)
// RBAC: read = billing.invoice:read · create = billing.kasir:create. Kasir di-resolve server (actor).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { PaymentInput } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const GET = route({
  resource: "billing.invoice",
  action: "read",
  params: IdParam,
  handler: ({ params }) => billingInvoiceService.listPayments(params.id),
});

export const POST = route({
  resource: "billing.kasir",
  action: "create",
  params: IdParam,
  body: PaymentInput,
  handler: async ({ params, body, actor }) =>
    reply(await billingInvoiceService.recordPayment(params.id, body, actor), {
      status: 201,
      message: "Pembayaran dicatat",
    }),
});
