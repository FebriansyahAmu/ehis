// REST: rekam medis — tab Tindakan (pencatatan tindakan dilakukan per kunjungan).
//   GET  /api/v1/kunjungan/:id/tindakan → daftar tindakan tercatat
//   POST /api/v1/kunjungan/:id/tindakan → tambah 1 tindakan
// RBAC: clinical.tindakan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { TindakanMedisInput } from "@/lib/schemas/tindakanMedis/tindakanMedis";
import { tindakanMedisService } from "@/lib/services/tindakanMedis/tindakanMedisService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await tindakanMedisService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.tindakan",
  action: "create",
  params: IdParam,
  body: TindakanMedisInput,
  handler: async ({ params, body, actor }) =>
    reply(await tindakanMedisService.add(params.id, body, actor), {
      status: 201,
      message: `Tindakan ${body.nama} ditambahkan`,
    }),
});
