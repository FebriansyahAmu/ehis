// REST: GET /api/v1/farmasi/resep/:id — detail satu order resep utk halaman Farmasi
// (telaah/dispensing). RBAC ancillary.farmasi.telaah:read (Apoteker; penunjang berdiri-
// sendiri, lintas-kunjungan → scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { FarmasiResepIdParam } from "@/lib/schemas/resep/resep";
import { resepService } from "@/lib/services/resep/resepService";

export const GET = route({
  resource: "ancillary.farmasi.telaah",
  action: "read",
  scopeKunjungan: false,
  params: FarmasiResepIdParam,
  aksesLog: (o) => ({ kunjunganId: o.kunjunganId }), // log akses RM (pasien/unit diturunkan)
  handler: async ({ params, actor }) => reply(await resepService.getFarmasiOne(params.id, actor)),
});
