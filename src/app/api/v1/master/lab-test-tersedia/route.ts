// REST: /api/v1/master/lab-test-tersedia — katalog tes lab ter-assign untuk konsumsi KLINIS.
//   GET ?ruanganKode=&penjaminKode=&jenisRuangan=  → daftar tes (distinct) yang boleh di-order;
//   hanya tes yang ter-assign ke ruangan LABORATORIUM via Mapping Hub → Layanan Unit (grup Lab).
// RBAC: gate `clinical.tindakan:read` (Dokter/Perawat) — "Tindakan / Order" mencakup order Lab/Rad.
// BUKAN master.katalog/master.mapping (perawat tak punya hak master). Tanpa params.id → tak kena
// ABAC kunjungan (scopeKunjungan:false). Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { LabTestTersediaQuery } from "@/lib/schemas/master/labTestTersedia";
import { layananUnitLabService } from "@/lib/services/master/layananUnitLabService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: LabTestTersediaQuery,
  handler: async ({ query }) => {
    const items = await layananUnitLabService.listLabTestTersedia(query);
    return reply(items);
  },
});
