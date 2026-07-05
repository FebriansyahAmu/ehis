// REST: rekam medis — Resume Pulang RI (salinan discharge summary untuk pasien).
//   GET  /api/v1/kunjungan/:id/resume-pulang → revisi terkini (null = belum diisi)
//   POST /api/v1/kunjungan/:id/resume-pulang → simpan (append latest-wins, 201; reset TTE)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).
// allowWhenLocked: dokumen kepulangan dilengkapi PASCA-pulang. TTE = POST /resume-pulang/sign.

import { route, reply } from "@/lib/http/route";
import { IdParam, ResumePulangInput } from "@/lib/schemas/resumePulang/resumePulang";
import { resumePulangService } from "@/lib/services/resumePulang/resumePulangService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await resumePulangService.get(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  allowWhenLocked: true, // resume pulang dilengkapi pasca-Selesai (salinan pasien)
  params: IdParam,
  body: ResumePulangInput,
  handler: async ({ params, body, actor }) =>
    reply(await resumePulangService.save(params.id, body, actor), {
      status: 201,
      message: "Resume pulang tersimpan",
    }),
});
