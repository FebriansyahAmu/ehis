// REST: rekam medis — tab Order Lab (order pemeriksaan lab per kunjungan → unit Laboratorium).
//   GET  /api/v1/kunjungan/:id/lab → daftar order lab kunjungan
//   POST /api/v1/kunjungan/:id/lab → buat 1 order lab (header + items)
// RBAC: clinical.tindakan (read/create) — "Tindakan / Order" mencakup order Lab/Rad (Dokter/Perawat).
// ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { LabOrderInput } from "@/lib/schemas/lab/labOrder";
import { labOrderService } from "@/lib/services/lab/labOrderService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await labOrderService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.tindakan",
  action: "create",
  params: IdParam,
  body: LabOrderInput,
  handler: async ({ params, body, actor }) =>
    reply(await labOrderService.create(params.id, body, actor), {
      status: 201,
      message: `Order ${body.items.length} pemeriksaan dikirim ke ${body.labNama}`,
    }),
});
