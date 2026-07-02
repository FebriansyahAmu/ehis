// REST: detail konsultasi (sisi KONSULTAN — halaman jawab fokus).
//   GET /api/v1/konsultasi/:id → 1 konsultasi + identitas pasien/kunjungan asal
// RBAC: clinical.konsultasi:read. scopeKunjungan:false WAJIB — params.id di sini = konsultasiId,
// BUKAN kunjunganId (default ABAC clinical.* akan salah-tafsir → 404).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/konsultasi/konsultasi";
import { konsultasiService } from "@/lib/services/konsultasi/konsultasiService";

export const GET = route({
  resource: "clinical.konsultasi",
  action: "read",
  scopeKunjungan: false,
  params: IdParam,
  handler: async ({ params, actor }) => reply(await konsultasiService.getById(params.id, actor)),
});
