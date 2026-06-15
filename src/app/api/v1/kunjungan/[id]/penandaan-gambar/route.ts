// REST: rekam medis — tab Penandaan Gambar (status lokalis / body-diagram).
//   GET  /api/v1/kunjungan/:id/penandaan-gambar → daftar penanda aktif (per kunjungan)
//   POST /api/v1/kunjungan/:id/penandaan-gambar → tambah 1 penanda (pin/draw) (201)
// RBAC: clinical.pemeriksaan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PenandaanGambarInput } from "@/lib/schemas/penandaanGambar/penandaanGambar";
import { penandaanGambarService } from "@/lib/services/penandaanGambar/penandaanGambarService";

export const GET = route({
  resource: "clinical.pemeriksaan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await penandaanGambarService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.pemeriksaan",
  action: "create",
  params: IdParam,
  body: PenandaanGambarInput,
  handler: async ({ params, body, actor }) =>
    reply(await penandaanGambarService.add(params.id, body, actor), {
      status: 201,
      message: "Penanda gambar ditambahkan",
    }),
});
