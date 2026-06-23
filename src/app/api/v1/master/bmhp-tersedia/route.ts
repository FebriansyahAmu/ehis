// REST: /api/v1/master/bmhp-tersedia — katalog BMHP ter-assign ke lokasi Farmasi untuk konsumsi KLINIS.
//   GET ?ruanganKode=  → daftar BMHP (distinct, kode BHP-… saja) yang tersedia di ≥1 depo Farmasi;
//   difilter lokasi (opsional).
// RBAC: gate `clinical.tindakan:read` (Dokter/Perawat) — "Tindakan / Order" mencakup order BMHP.
// BUKAN master.katalog/master.mapping (klinisi tak punya hak master). Tanpa params.id → tak kena
// ABAC kunjungan (scopeKunjungan:false). Selaras lab-test-tersedia / obat-tersedia.

import { route, reply } from "@/lib/http/route";
import { BmhpTersediaQuery } from "@/lib/schemas/master/bmhpTersedia";
import { formulariumBmhpService } from "@/lib/services/master/formulariumBmhpService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: BmhpTersediaQuery,
  handler: async ({ query }) => {
    const items = await formulariumBmhpService.listBmhpTersedia(query);
    return reply(items);
  },
});
