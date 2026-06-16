// REST: /api/v1/master/status-enum-tersedia — enum untuk konsumsi KLINIS.
//   GET ?groupKey=&q=  → entri AKTIF (opsi dropdown: PasienPulang/StatusFisik/TTV/Transfer/…)
// RBAC: gate `clinical.rekammedis:read` (Dokter/Perawat) — BUKAN master.konfigurasi (klinisi tak
// punya hak master). Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false). Pola
// identik asesmen-tersedia / skala-tersedia. Reuse statusEnumService.list, status dipaksa "Aktif".

import { route, reply } from "@/lib/http/route";
import { EnumQuery } from "@/lib/schemas/master/statusEnum";
import { statusEnumService } from "@/lib/services/master/statusEnumService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: EnumQuery,
  handler: async ({ query }) => {
    const { items } = await statusEnumService.list({
      groupKey: query.groupKey,
      q: query.q,
      status: "Aktif",
      limit: query.limit ?? 500,
    });
    return reply(items);
  },
});
