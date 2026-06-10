// REST: rekam medis — tab CPPT (catatan perkembangan terintegrasi, per-item).
//   GET  /api/v1/kunjungan/:id/cppt → daftar catatan (terbaru dulu)
//   POST /api/v1/kunjungan/:id/cppt → tambah 1 catatan (SOAP/SBAR/TBAK)

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { CpptItemInput } from "@/lib/schemas/cppt/cppt";
import { cpptService } from "@/lib/services/cppt/cpptService";

export const GET = route({
  resource: "clinical.cppt",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => cpptService.get(params.id, actor),
});

export const POST = route({
  resource: "clinical.cppt",
  action: "create",
  params: IdParam,
  body: CpptItemInput,
  handler: async ({ params, body, actor }) =>
    reply(await cpptService.add(params.id, body, actor), {
      status: 201,
      message: `Catatan ${body.jenisCatatan} ditambahkan`,
    }),
});
