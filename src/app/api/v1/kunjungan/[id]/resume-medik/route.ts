// REST: rekam medis — Resume Medik Rawat Inap (kelengkapan RM + klaim BPJS).
//   GET  /api/v1/kunjungan/:id/resume-medik → revisi terkini (null = belum diisi)
//   POST /api/v1/kunjungan/:id/resume-medik → simpan (append latest-wins, 201; reset TTE)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).
// TTE sign-off = POST /resume-medik/sign (route terpisah).

import { route, reply } from "@/lib/http/route";
import { IdParam, ResumeMedikInput } from "@/lib/schemas/resumeMedik/resumeMedik";
import { resumeMedikService } from "@/lib/services/resumeMedik/resumeMedikService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await resumeMedikService.get(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  allowWhenLocked: true, // resume medik DILENGKAPI pasca-pulang (PMK 269 ≤1×24 jam)
  params: IdParam,
  body: ResumeMedikInput,
  handler: async ({ params, body, actor }) =>
    reply(await resumeMedikService.save(params.id, body, actor), {
      status: 201,
      message: "Resume medik tersimpan",
    }),
});
