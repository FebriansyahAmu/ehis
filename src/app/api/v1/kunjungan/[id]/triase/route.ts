// REST: rekam medis IGD — pengkajian triase (TODO-CLINICAL Domain 1).
//   GET  /api/v1/kunjungan/:id/triase  → pengkajian terbaru (null bila belum ada)
//   POST /api/v1/kunjungan/:id/triase  → simpan pengkajian baru (append) + sinkron level
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { TriaseInput } from "@/lib/schemas/triase";
import { triaseService } from "@/lib/services/triaseService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => triaseService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: TriaseInput,
  handler: async ({ params, body, actor }) =>
    reply(await triaseService.save(params.id, body, actor), {
      status: 201,
      message: "Pengkajian triase tersimpan",
    }),
});
