// REST: rekam medis — observasi TTV (TODO-CLINICAL Domain 2, shared IGD/RI/RJ).
//   GET  /api/v1/kunjungan/:id/observasi  → seluruh time-series TTV (terbaru dulu, [] bila kosong)
//   POST /api/v1/kunjungan/:id/observasi  → catat satu pengukuran TTV (append)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { ObservationInput } from "@/lib/schemas/observation";
import { observationService } from "@/lib/services/observationService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => observationService.list(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: ObservationInput,
  handler: async ({ params, body, actor }) =>
    reply(await observationService.record(params.id, body, actor), {
      status: 201,
      message: "Observasi TTV tersimpan",
    }),
});
