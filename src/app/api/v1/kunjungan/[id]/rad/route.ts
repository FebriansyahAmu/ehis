// REST: rekam medis — tab Order Radiologi (order pemeriksaan rad per kunjungan → unit Radiologi).
//   GET  /api/v1/kunjungan/:id/rad → daftar order rad kunjungan
//   POST /api/v1/kunjungan/:id/rad → buat 1 order rad (header + items)
// RBAC: clinical.tindakan (read/create) — "Tindakan / Order" mencakup order Lab/Rad (Dokter/Perawat).
// ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { RadOrderInput } from "@/lib/schemas/rad/radOrder";
import { radOrderService } from "@/lib/services/rad/radOrderService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await radOrderService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.tindakan",
  action: "create",
  params: IdParam,
  body: RadOrderInput,
  handler: async ({ params, body, actor }) =>
    reply(await radOrderService.create(params.id, body, actor), {
      status: 201,
      message: `Order ${body.items.length} pemeriksaan dikirim ke ${body.radNama}`,
    }),
});
