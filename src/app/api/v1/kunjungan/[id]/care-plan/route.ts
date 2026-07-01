// REST: rekam medis — tab Rencana Asuhan (RAT). Daftar masalah + goal per kunjungan.
//   GET  /api/v1/kunjungan/:id/care-plan → daftar masalah (+ goals)
//   POST /api/v1/kunjungan/:id/care-plan → tambah 1 masalah (+ goal awal opsional) (201)
// RBAC: clinical.careplan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, MasalahInput } from "@/lib/schemas/carePlan/carePlan";
import { carePlanService } from "@/lib/services/carePlan/carePlanService";

export const GET = route({
  resource: "clinical.careplan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await carePlanService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.careplan",
  action: "create",
  params: IdParam,
  body: MasalahInput,
  handler: async ({ params, body, actor }) =>
    reply(await carePlanService.addMasalah(params.id, body, actor), {
      status: 201,
      message: "Masalah rencana asuhan ditambahkan",
    }),
});
