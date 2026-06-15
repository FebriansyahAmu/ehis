// REST: rekam medis — tab Penilaian, sub-menu Jantung / Kanker (asesmen komposit spesifik-penyakit).
//   GET  /api/v1/kunjungan/:id/penilaian-komposit?jenis=Jantung → riwayat (per kunjungan, filter jenis)
//   POST /api/v1/kunjungan/:id/penilaian-komposit              → tambah 1 (201, append-only)
// RBAC: clinical.penilaian (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import {
  IdParam, PenilaianKompositInput, PenilaianKompositQuery,
} from "@/lib/schemas/penilaian/penilaianKomposit";
import { penilaianKompositService } from "@/lib/services/penilaian/penilaianKompositService";

export const GET = route({
  resource: "clinical.penilaian",
  action: "read",
  params: IdParam,
  query: PenilaianKompositQuery,
  handler: async ({ params, query, actor }) =>
    reply(await penilaianKompositService.list(params.id, query.jenis, actor)),
});

export const POST = route({
  resource: "clinical.penilaian",
  action: "create",
  params: IdParam,
  body: PenilaianKompositInput,
  handler: async ({ params, body, actor }) =>
    reply(await penilaianKompositService.add(params.id, body, actor), {
      status: 201,
      message: "Penilaian tersimpan",
    }),
});
