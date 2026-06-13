// REST: rekam medis — tab Keperawatan (asuhan keperawatan SDKI/SLKI/SIKI).
//   GET  /api/v1/kunjungan/:id/asuhan-keperawatan → daftar asuhan (per kunjungan)
//   POST /api/v1/kunjungan/:id/asuhan-keperawatan → tambah 1 diagnosa keperawatan (201)
// RBAC: clinical.keperawatan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, AsuhanKeperawatanInput } from "@/lib/schemas/keperawatan/asuhanKeperawatan";
import { asuhanKeperawatanService } from "@/lib/services/keperawatan/asuhanKeperawatanService";

export const GET = route({
  resource: "clinical.keperawatan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await asuhanKeperawatanService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.keperawatan",
  action: "create",
  params: IdParam,
  body: AsuhanKeperawatanInput,
  handler: async ({ params, body, actor }) =>
    reply(await asuhanKeperawatanService.add(params.id, body, actor), {
      status: 201,
      message: "Asuhan keperawatan ditambahkan",
    }),
});
