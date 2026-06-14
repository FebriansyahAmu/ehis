// REST: rekam medis — tab Penilaian, sub-menu Nyeri (asesmen komprehensif).
//   GET  /api/v1/kunjungan/:id/penilaian-nyeri → riwayat asesmen nyeri (per kunjungan)
//   POST /api/v1/kunjungan/:id/penilaian-nyeri → tambah 1 asesmen (201, append-only)
// SKOR NRS bukan di sini — single source = Observation/TTV (/kunjungan/:id/observasi).
// RBAC: clinical.penilaian (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PenilaianNyeriInput } from "@/lib/schemas/penilaian/penilaianNyeri";
import { penilaianNyeriService } from "@/lib/services/penilaian/penilaianNyeriService";

export const GET = route({
  resource: "clinical.penilaian",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await penilaianNyeriService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.penilaian",
  action: "create",
  params: IdParam,
  body: PenilaianNyeriInput,
  handler: async ({ params, body, actor }) =>
    reply(await penilaianNyeriService.add(params.id, body, actor), {
      status: 201,
      message: "Asesmen nyeri tersimpan",
    }),
});
