// REST: rekam medis — Discharge Planning step 1: Asesmen Pemulangan (SNARS ARK 5).
//   GET  /api/v1/kunjungan/:id/discharge/asesmen → revisi terkini (null = belum diisi)
//   POST /api/v1/kunjungan/:id/discharge/asesmen → simpan (append latest-wins, 201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).
// Step Edukasi & Checklist = route sibling menyusul (/discharge/edukasi, /discharge/checklist).

import { route, reply } from "@/lib/http/route";
import { IdParam, DischargeAsesmenInput } from "@/lib/schemas/discharge/dischargeAsesmen";
import { dischargeAsesmenService } from "@/lib/services/discharge/dischargeAsesmenService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await dischargeAsesmenService.get(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: DischargeAsesmenInput,
  handler: async ({ params, body, actor }) =>
    reply(await dischargeAsesmenService.save(params.id, body, actor), {
      status: 201,
      message: "Asesmen pemulangan tersimpan",
    }),
});
