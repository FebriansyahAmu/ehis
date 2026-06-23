// REST: rekam medis — tab Order BMHP (permintaan BMHP per kunjungan → depo Farmasi).
//   GET  /api/v1/kunjungan/:id/bmhp → daftar order BMHP kunjungan
//   POST /api/v1/kunjungan/:id/bmhp → buat 1 order BMHP (header + items)
// RBAC: clinical.tindakan (read/create) — Dokter & Perawat boleh order BMHP. ABAC careUnit
// ditegakkan route() (clinical.* + params.id). Selaras kunjungan/:id/lab.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { BmhpOrderInput } from "@/lib/schemas/bmhpOrder/bmhpOrder";
import { bmhpOrderService } from "@/lib/services/bmhpOrder/bmhpOrderService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await bmhpOrderService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.tindakan",
  action: "create",
  params: IdParam,
  body: BmhpOrderInput,
  handler: async ({ params, body, actor }) =>
    reply(await bmhpOrderService.create(params.id, body, actor), {
      status: 201,
      message: `Order ${body.items.length} BMHP dikirim ke ${body.depoNama}`,
    }),
});
