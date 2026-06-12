// REST: /api/v1/master/tindakan-tersedia — katalog tindakan ter-assign untuk konsumsi KLINIS.
//   GET ?ruanganKode=  → daftar tindakan (distinct) yang boleh dilakukan; Lab/Rad TIDAK termuat.
// RBAC: gate `clinical.tindakan:read` (Dokter/Perawat) — BUKAN master.katalog/master.mapping
// (perawat tak punya hak master). Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { TindakanTersediaQuery } from "@/lib/schemas/master/tindakanTersedia";
import { layananUnitService } from "@/lib/services/master/layananUnitService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: TindakanTersediaQuery,
  handler: async ({ query }) => {
    const items = await layananUnitService.listTindakanTersedia(query);
    return reply(items);
  },
});
