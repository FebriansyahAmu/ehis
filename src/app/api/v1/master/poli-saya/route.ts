// REST: ruangan/poli tempat AKTOR ditugaskan (SDM Assignment, self-scoped) — konsumen klinis.
//   GET /api/v1/master/poli-saya → [{ locationId, ruanganKode, ruanganNama }]
// Dipakai halaman Rawat Jalan: Panel Poliklinik hanya menampilkan poli tempat user login
// di-assign (Mapping Hub → SDM Assignment). Gate `clinical.rekammedis:read` (pola *-tersedia,
// BUKAN master.penugasan-ruangan — role klinis tak punya baca master SDM penuh);
// scopeKunjungan:false (tanpa konteks kunjungan). Tanpa pegawai (akun non-SDM) → [].

import { route, reply } from "@/lib/http/route";
import { penugasanRuanganService } from "@/lib/services/penugasanRuanganService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  scopeKunjungan: false,
  handler: async ({ actor }) => {
    if (!actor.pegawaiId) return reply([]);
    const { items } = await penugasanRuanganService.listPenugasan({
      pegawaiId: actor.pegawaiId,
      locationId: undefined,
      cursor: undefined,
      limit: 100,
    });
    // Identitas SDM diri sendiri tak perlu diekspos — cukup ruangan penugasan.
    return reply(items.map((i) => ({
      locationId: i.locationId,
      ruanganKode: i.ruanganKode,
      ruanganNama: i.ruanganNama,
    })));
  },
});
