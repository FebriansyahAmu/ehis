// REST: /api/v1/master/paket-layanan-tersedia — paket layanan AKTIF untuk KONSUMSI.
//   GET → semua paket status Aktif (kartu pilih paket). Konsumen: registrasi → Ubah Paket.
// RBAC: gate `registration.kunjungan:read` (loket) — BUKAN `master.katalog` (loket tak punya hak
// master). Tanpa params.id → scopeKunjungan:false. Pola konsumen *-tersedia (mis. tarif-kamar-tersedia).

import { route, reply } from "@/lib/http/route";
import { paketLayananService } from "@/lib/services/master/paketLayananService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: false, // katalog paket murni (tanpa konteks kunjungan)
  handler: async () => reply(await paketLayananService.listTersedia()),
});
