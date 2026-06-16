// REST: /api/v1/master/asesmen-tersedia — katalog asesmen untuk konsumsi KLINIS.
//   GET ?kategori=&q=  → item AKTIF (opsi dropdown AllergyPane/RiwayatPane di AsesmenMedisTab)
// RBAC: gate `clinical.rekammedis:read` (Dokter/Perawat) — BUKAN master.katalog (klinisi tak
// punya hak master). Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).
// Pola identik skala-tersedia / tindakan-tersedia (read katalog master, gate klinis). Reuse
// asesmenKatalogService.list dengan status dipaksa "Aktif".

import { route, reply } from "@/lib/http/route";
import { AsesmenQuery } from "@/lib/schemas/master/asesmenKatalog";
import { asesmenKatalogService } from "@/lib/services/master/asesmenKatalogService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: AsesmenQuery,
  handler: async ({ query }) => {
    const { items } = await asesmenKatalogService.list({
      kategori: query.kategori,
      q: query.q,
      status: "Aktif",
      limit: query.limit ?? 500,
    });
    return reply(items);
  },
});
