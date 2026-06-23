// REST: /api/v1/inventory/stok-klinis?lokasiId=&jenis= — overlay stok di depo untuk picker Resep
// (Obat, default) & Order BMHP (BMHP). Gate KLINIS `clinical.resep:read` (Dokter/Perawat) — BUKAN
// inventory.* (klinisi tak punya hak inventory). Advisory: dipakai FE merge ke katalog
// formularium/ketersediaan, BUKAN penjaga dispensing. Tanpa params.id → tak kena ABAC kunjungan.

import { route, reply } from "@/lib/http/route";
import { StokKlinisQuery } from "@/lib/schemas/inventory/stock";
import { stockService } from "@/lib/services/inventory/stockService";

export const GET = route({
  resource: "clinical.resep",
  action: "read",
  scopeKunjungan: false,
  query: StokKlinisQuery,
  handler: async ({ query }) => reply(await stockService.listStokKlinis(query.lokasiId, query.jenis)),
});
