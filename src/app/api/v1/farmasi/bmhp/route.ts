// REST: /api/v1/farmasi/bmhp — worklist order BMHP masuk ke Farmasi (lintas-kunjungan).
//   GET ?depoKode=&status=&noRM= → daftar order (header + pasien + items) untuk Terima/serah.
// RBAC: gate ancillary.farmasi.serah:read (Apoteker) — penunjang berdiri-sendiri.
// Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { FarmasiBmhpQuery } from "@/lib/schemas/bmhpOrder/bmhpOrder";
import { bmhpOrderService } from "@/lib/services/bmhpOrder/bmhpOrderService";

export const GET = route({
  resource: "ancillary.farmasi.serah",
  action: "read",
  scopeKunjungan: false,
  query: FarmasiBmhpQuery,
  handler: async ({ query, actor }) => reply(await bmhpOrderService.listForFarmasi(query, actor)),
});
