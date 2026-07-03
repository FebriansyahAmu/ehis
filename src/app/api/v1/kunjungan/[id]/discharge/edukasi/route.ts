// REST: rekam medis — Discharge Planning step 2: Edukasi Bertahap (SNARS HPK 2).
//   GET  /api/v1/kunjungan/:id/discharge/edukasi → semua log aktif (FE grup per topik)
//   POST /api/v1/kunjungan/:id/discharge/edukasi → catat 1 sesi (petugas = actor login, 201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, DischargeEdukasiInput } from "@/lib/schemas/discharge/dischargeEdukasi";
import { dischargeEdukasiService } from "@/lib/services/discharge/dischargeEdukasiService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await dischargeEdukasiService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: DischargeEdukasiInput,
  handler: async ({ params, body, actor }) =>
    reply(await dischargeEdukasiService.add(params.id, body, actor), {
      status: 201,
      message: "Log edukasi tersimpan",
    }),
});
