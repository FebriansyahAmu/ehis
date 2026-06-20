// REST: /api/v1/master/lokasi-farmasi — daftar Ruangan kategori "Farmasi" (depo/apotek) untuk
// dropdown tujuan resep di klinis. RBAC: gate clinical.resep:read (Dokter/Perawat) — BUKAN
// master.view (klinisi tak punya hak master). Reuse ruanganService.listRuanganByType (aktif saja).
// Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false). Selaras obat-tersedia.

import { route, reply } from "@/lib/http/route";
import { ruanganService } from "@/lib/services/ruanganService";

export const GET = route({
  resource: "clinical.resep",
  action: "read",
  scopeKunjungan: false,
  handler: async ({ actor }) => {
    const locs = await ruanganService.listRuanganByType("Farmasi", actor);
    return reply(locs.map((l) => ({ id: l.id, kode: l.kode, nama: l.name })));
  },
});
