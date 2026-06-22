// REST: /api/v1/master/rad-catalog-tersedia — katalog pemeriksaan radiologi ter-assign untuk konsumsi KLINIS.
//   GET ?ruanganKode=&penjaminKode=&jenisRuangan=  → daftar pemeriksaan (distinct) yang boleh di-order;
// hanya yang ter-assign ke ruangan RADIOLOGI via Mapping Hub → Layanan Unit (grup Rad).
// RBAC: gate `clinical.tindakan:read` (Dokter/Perawat) — "Tindakan / Order" mencakup order Lab/Rad.
// BUKAN master.katalog/master.mapping (perawat tak punya hak master). Tanpa params.id → tak kena
// ABAC kunjungan (scopeKunjungan:false). Route TIPIS. Selaras lab-test-tersedia.

import { route, reply } from "@/lib/http/route";
import { RadCatalogTersediaQuery } from "@/lib/schemas/master/radCatalogTersedia";
import { layananUnitRadService } from "@/lib/services/master/layananUnitRadService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: RadCatalogTersediaQuery,
  handler: async ({ query }) => {
    const items = await layananUnitRadService.listRadCatalogTersedia(query);
    return reply(items);
  },
});
