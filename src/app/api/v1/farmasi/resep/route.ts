// REST: /api/v1/farmasi/resep — worklist order resep masuk ke Farmasi (lintas-kunjungan).
//   GET ?depoKode=&status= → daftar order (header + pasien + items) untuk telaah/dispensasi.
// RBAC: gate ancillary.farmasi.telaah:read (Apoteker) — penunjang berdiri-sendiri.
// Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { FarmasiResepQuery } from "@/lib/schemas/resep/resep";
import { resepService } from "@/lib/services/resep/resepService";

export const GET = route({
  resource: "ancillary.farmasi.telaah",
  action: "read",
  scopeKunjungan: false,
  query: FarmasiResepQuery,
  handler: async ({ query, actor }) => reply(await resepService.listForFarmasi(query, actor)),
});
