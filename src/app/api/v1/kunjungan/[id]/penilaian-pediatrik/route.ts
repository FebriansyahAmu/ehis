// REST: rekam medis — tab Penilaian, sub-menu Pediatrik.
//   GET  /api/v1/kunjungan/:id/penilaian-pediatrik → riwayat penilaian pediatrik (per kunjungan)
//   POST /api/v1/kunjungan/:id/penilaian-pediatrik → tambah 1 penilaian (201, append-only)
// RBAC: clinical.penilaian (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PenilaianPediatrikInput } from "@/lib/schemas/penilaian/penilaianPediatrik";
import { penilaianPediatrikService } from "@/lib/services/penilaian/penilaianPediatrikService";

export const GET = route({
  resource: "clinical.penilaian",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await penilaianPediatrikService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.penilaian",
  action: "create",
  params: IdParam,
  body: PenilaianPediatrikInput,
  handler: async ({ params, body, actor }) =>
    reply(await penilaianPediatrikService.add(params.id, body, actor), {
      status: 201,
      message: "Penilaian pediatrik tersimpan",
    }),
});
