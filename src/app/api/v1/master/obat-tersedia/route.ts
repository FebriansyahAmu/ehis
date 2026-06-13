// REST: /api/v1/master/obat-tersedia — katalog obat ter-formularium untuk konsumsi KLINIS.
//   GET ?ruanganKode=  → daftar obat (distinct) yang masuk formularium; difilter ruangan (opsional).
// RBAC: gate `clinical.resep:read` (Dokter/Perawat) — BUKAN master.katalog/master.mapping (klinisi
// tak punya hak master). Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { ObatTersediaQuery } from "@/lib/schemas/master/obatTersedia";
import { formulariumService } from "@/lib/services/master/formulariumService";

export const GET = route({
  resource: "clinical.resep",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: ObatTersediaQuery,
  handler: async ({ query }) => {
    const items = await formulariumService.listObatTersedia(query);
    return reply(items);
  },
});
