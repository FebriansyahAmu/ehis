// REST: /api/v1/kunjungan/:id/petugas?profesi= — roster petugas kunjungan.
//   GET → pegawai aktif yang DITUGASKAN ke ruangan kunjungan (SDM Assignment),
//         fallback lintas-ruangan bila kunjungan tanpa ruangan.
// Gate `registration.kunjungan:read` (dipegang role klinis) — BUKAN `master.pegawai:read`
// (role klinis tak boleh baca master SDM penuh; DTO hanya nama+profesi).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { PetugasQuery } from "@/lib/schemas/penugasanRuangan";
import { penugasanRuanganService } from "@/lib/services/penugasanRuanganService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: true, // konsumen klinis → batasi ke unit kerja actor (anti-IDOR)
  params: IdParam,
  query: PetugasQuery,
  handler: ({ params, query, actor }) =>
    penugasanRuanganService.listPetugasKunjungan(params.id, query.profesi, actor),
});
