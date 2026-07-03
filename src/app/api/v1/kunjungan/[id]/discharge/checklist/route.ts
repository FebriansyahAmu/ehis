// REST: rekam medis — Discharge Planning step 3: Checklist Kesiapan H-1 (SNARS ARK 3).
//   GET  /api/v1/kunjungan/:id/discharge/checklist → revisi terkini (null = belum diisi)
//   POST /api/v1/kunjungan/:id/discharge/checklist → simpan (append latest-wins, 201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).
// Melengkapi trio /discharge/{asesmen,edukasi,checklist}.

import { route, reply } from "@/lib/http/route";
import { IdParam, DischargeChecklistInput } from "@/lib/schemas/discharge/dischargeChecklist";
import { dischargeChecklistService } from "@/lib/services/discharge/dischargeChecklistService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await dischargeChecklistService.get(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: DischargeChecklistInput,
  handler: async ({ params, body, actor }) =>
    reply(await dischargeChecklistService.save(params.id, body, actor), {
      status: 201,
      message: "Checklist kesiapan tersimpan",
    }),
});
