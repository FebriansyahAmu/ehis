// REST: rekam medis — tab Penilaian, sub-menu Status Klinis.
//   GET  /api/v1/kunjungan/:id/penilaian-status → riwayat penilaian status (per kunjungan)
//   POST /api/v1/kunjungan/:id/penilaian-status → tambah 1 penilaian (201, append-only)
// RBAC: clinical.penilaian (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).
// NB: folder `penilaian-status` (BUKAN `status` = transisi status kunjungan, endpoint berbeda).

import { route, reply } from "@/lib/http/route";
import { IdParam, PenilaianStatusInput } from "@/lib/schemas/penilaian/penilaianStatus";
import { penilaianStatusService } from "@/lib/services/penilaian/penilaianStatusService";

export const GET = route({
  resource: "clinical.penilaian",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await penilaianStatusService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.penilaian",
  action: "create",
  params: IdParam,
  body: PenilaianStatusInput,
  handler: async ({ params, body, actor }) =>
    reply(await penilaianStatusService.add(params.id, body, actor), {
      status: 201,
      message: "Penilaian status klinis tersimpan",
    }),
});
