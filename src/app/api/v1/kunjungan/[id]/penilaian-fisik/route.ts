// REST: rekam medis — tab Penilaian, sub-menu Fisik.
//   GET  /api/v1/kunjungan/:id/penilaian-fisik → riwayat penilaian fisik (per kunjungan)
//   POST /api/v1/kunjungan/:id/penilaian-fisik → tambah 1 penilaian (201, append-only)
// RBAC: clinical.penilaian (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PenilaianFisikInput } from "@/lib/schemas/penilaian/penilaianFisik";
import { penilaianFisikService } from "@/lib/services/penilaian/penilaianFisikService";

export const GET = route({
  resource: "clinical.penilaian",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await penilaianFisikService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.penilaian",
  action: "create",
  params: IdParam,
  body: PenilaianFisikInput,
  handler: async ({ params, body, actor }) =>
    reply(await penilaianFisikService.add(params.id, body, actor), {
      status: 201,
      message: "Penilaian fisik tersimpan",
    }),
});
