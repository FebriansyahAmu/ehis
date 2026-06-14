// REST: rekam medis — tab Pemeriksaan, sub Penunjang (diagnostik bedside non-Lab/Rad).
//   GET  /api/v1/kunjungan/:id/pemeriksaan-penunjang → daftar penunjang aktif (per kunjungan)
//   POST /api/v1/kunjungan/:id/pemeriksaan-penunjang → tambah 1 hasil penunjang (201)
// RBAC: clinical.pemeriksaan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PemeriksaanPenunjangInput } from "@/lib/schemas/pemeriksaan/pemeriksaanPenunjang";
import { pemeriksaanPenunjangService } from "@/lib/services/pemeriksaan/pemeriksaanPenunjangService";

export const GET = route({
  resource: "clinical.pemeriksaan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await pemeriksaanPenunjangService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.pemeriksaan",
  action: "create",
  params: IdParam,
  body: PemeriksaanPenunjangInput,
  handler: async ({ params, body, actor }) =>
    reply(await pemeriksaanPenunjangService.add(params.id, body, actor), {
      status: 201,
      message: "Hasil penunjang ditambahkan",
    }),
});
