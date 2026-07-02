// REST: worklist Konsultasi Masuk (sisi KONSULTAN — halaman Rawat Jalan, lintas kunjungan).
//   GET /api/v1/konsultasi?status=aktif|semua|<status> → daftar + identitas pasien/kunjungan asal
// RBAC: clinical.konsultasi:read. scopeKunjungan:false — konsultan bekerja lintas careUnit
// (konsul dari IGD/RI); ABAC per-kunjungan justru memblokir (pola ancillary worklist).

import { route, reply } from "@/lib/http/route";
import { KonsultasiWorklistQuery } from "@/lib/schemas/konsultasi/konsultasi";
import { konsultasiService } from "@/lib/services/konsultasi/konsultasiService";

export const GET = route({
  resource: "clinical.konsultasi",
  action: "read",
  scopeKunjungan: false,
  query: KonsultasiWorklistQuery,
  handler: async ({ query, actor }) => reply(await konsultasiService.listWorklist(query, actor)),
});
