// REST: rekam medis — tab Serah Terima Shift (handover keperawatan SBAR, closed-loop).
//   GET  /api/v1/kunjungan/:id/serah-terima → daftar serah terima aktif (per kunjungan)
//   POST /api/v1/kunjungan/:id/serah-terima → perawat keluar menyusun SBAR (201, belum diterima)
// RBAC: clinical.keperawatan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, SerahTerimaInput } from "@/lib/schemas/serahTerima/serahTerima";
import { serahTerimaService } from "@/lib/services/serahTerima/serahTerimaService";

export const GET = route({
  resource: "clinical.keperawatan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await serahTerimaService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.keperawatan",
  action: "create",
  params: IdParam,
  body: SerahTerimaInput,
  handler: async ({ params, body, actor }) =>
    reply(await serahTerimaService.add(params.id, body, actor), {
      status: 201,
      message: "Serah terima disimpan",
    }),
});
