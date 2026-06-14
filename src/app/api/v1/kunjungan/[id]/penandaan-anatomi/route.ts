// REST: rekam medis — tab Pemeriksaan, sub Anatomi (penandaan area tubuh / body-map).
//   GET  /api/v1/kunjungan/:id/penandaan-anatomi → daftar penanda aktif (per kunjungan)
//   POST /api/v1/kunjungan/:id/penandaan-anatomi → tandai 1 area (201)
// RBAC: clinical.pemeriksaan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PenandaanAnatomiInput } from "@/lib/schemas/pemeriksaan/penandaanAnatomi";
import { penandaanAnatomiService } from "@/lib/services/pemeriksaan/penandaanAnatomiService";

export const GET = route({
  resource: "clinical.pemeriksaan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await penandaanAnatomiService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.pemeriksaan",
  action: "create",
  params: IdParam,
  body: PenandaanAnatomiInput,
  handler: async ({ params, body, actor }) =>
    reply(await penandaanAnatomiService.add(params.id, body, actor), {
      status: 201,
      message: "Area ditandai",
    }),
});
