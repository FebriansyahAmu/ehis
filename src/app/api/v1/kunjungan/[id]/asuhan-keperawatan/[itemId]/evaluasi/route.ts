// REST: rekam medis — tab Keperawatan, evaluasi shift (tabel anak AsuhanEvaluasi).
//   GET  /api/v1/kunjungan/:id/asuhan-keperawatan/:itemId/evaluasi → timeline evaluasi 1 asuhan
//   POST /api/v1/kunjungan/:id/asuhan-keperawatan/:itemId/evaluasi → tambah 1 evaluasi shift (201)
// POST mengembalikan DTO asuhan ter-refresh (statusLuaran disinkronkan ke evaluasi terbaru).
// RBAC: clinical.keperawatan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { ItemParam, EvaluasiInput } from "@/lib/schemas/keperawatan/asuhanKeperawatan";
import { asuhanKeperawatanService } from "@/lib/services/keperawatan/asuhanKeperawatanService";

export const GET = route({
  resource: "clinical.keperawatan",
  action: "read",
  params: ItemParam,
  handler: async ({ params, actor }) =>
    reply(await asuhanKeperawatanService.listEvaluasi(params.id, params.itemId, actor)),
});

export const POST = route({
  resource: "clinical.keperawatan",
  action: "create",
  params: ItemParam,
  body: EvaluasiInput,
  handler: async ({ params, body, actor }) =>
    reply(await asuhanKeperawatanService.addEvaluasi(params.id, params.itemId, body, actor), {
      status: 201,
      message: "Evaluasi shift ditambahkan",
    }),
});
