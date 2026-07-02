// REST: dokter konsultan tersedia (konsumen klinis — tab Konsultasi, picker "Dokter Konsultan").
//   GET /api/v1/master/konsultan-tersedia → [{ pegawaiId, namaTampil, profesi, spesialistik,
//   ruanganKode, ruanganNama }] — dokter AKTIF yang di-ASSIGN ke ruangan poli (LocationType
//   Rawat_Jalan) via Mapping Hub → SDM Assignment. FE mencocokkan SMF tujuan ↔ spesialistik.
// Gate `clinical.konsultasi:read` (pola *-tersedia, bukan master.pegawai); scopeKunjungan:false.

import { route, reply } from "@/lib/http/route";
import { penugasanRuanganService } from "@/lib/services/penugasanRuanganService";

export const GET = route({
  resource: "clinical.konsultasi",
  action: "read",
  scopeKunjungan: false,
  handler: async () => reply(await penugasanRuanganService.listKonsultanPoli()),
});
