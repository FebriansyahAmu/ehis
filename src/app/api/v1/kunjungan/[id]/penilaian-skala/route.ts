// REST: rekam medis — tab Penilaian, sub-menu Asesmen Risiko (skala master-driven).
//   GET  /api/v1/kunjungan/:id/penilaian-skala → riwayat penilaian skala (per kunjungan)
//   POST /api/v1/kunjungan/:id/penilaian-skala → tambah 1 penilaian (201, append-only)
// RBAC: clinical.penilaian (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PenilaianSkalaInput } from "@/lib/schemas/penilaian/penilaianSkala";
import { penilaianSkalaService } from "@/lib/services/penilaian/penilaianSkalaService";

export const GET = route({
  resource: "clinical.penilaian",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await penilaianSkalaService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.penilaian",
  action: "create",
  params: IdParam,
  body: PenilaianSkalaInput,
  handler: async ({ params, body, actor }) =>
    reply(await penilaianSkalaService.add(params.id, body, actor), {
      status: 201,
      message: "Penilaian skala tersimpan",
    }),
});
