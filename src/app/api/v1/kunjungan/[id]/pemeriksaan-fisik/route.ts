// REST: rekam medis — tab Pemeriksaan (Pemeriksaan Fisik, SNARS AP 1).
//   GET  /api/v1/kunjungan/:id/pemeriksaan-fisik → riwayat pemeriksaan (terbaru dulu)
//   POST /api/v1/kunjungan/:id/pemeriksaan-fisik → tambah 1 pemeriksaan (append-only, 201)
// RBAC: clinical.pemeriksaan (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, PemeriksaanFisikInput } from "@/lib/schemas/pemeriksaan/pemeriksaanFisik";
import { pemeriksaanFisikService } from "@/lib/services/pemeriksaan/pemeriksaanFisikService";

export const GET = route({
  resource: "clinical.pemeriksaan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await pemeriksaanFisikService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.pemeriksaan",
  action: "create",
  params: IdParam,
  body: PemeriksaanFisikInput,
  handler: async ({ params, body, actor }) =>
    reply(await pemeriksaanFisikService.add(params.id, body, actor), {
      status: 201,
      message: "Pemeriksaan fisik tersimpan",
    }),
});
