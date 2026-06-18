// REST: rekam medis — tab Resep Pasien (order obat per kunjungan → depo Farmasi).
//   GET  /api/v1/kunjungan/:id/resep → daftar order resep kunjungan
//   POST /api/v1/kunjungan/:id/resep → buat 1 order resep (header + items)
// RBAC: clinical.resep (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { ResepOrderInput } from "@/lib/schemas/resep/resep";
import { resepService } from "@/lib/services/resep/resepService";

export const GET = route({
  resource: "clinical.resep",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await resepService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.resep",
  action: "create",
  params: IdParam,
  body: ResepOrderInput,
  handler: async ({ params, body, actor }) =>
    reply(await resepService.create(params.id, body, actor), {
      status: 201,
      message: `Resep ${body.items.length} obat dikirim ke ${body.depoNama}`,
    }),
});
