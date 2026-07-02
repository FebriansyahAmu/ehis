// REST: rekam medis — tab MAR (Medication Administration Record per shift, RI).
//   GET  /api/v1/kunjungan/:id/mar → { items, entries } (obat dari resep + entri latest-wins)
//   POST /api/v1/kunjungan/:id/mar → catat 1 pemberian (201; koreksi = kirim ulang slot sama)
// RBAC: clinical.keperawatan (read/create — Perawat penulis utama). ABAC careUnit di route().

import { route, reply } from "@/lib/http/route";
import { IdParam, MarEntryInput } from "@/lib/schemas/mar/mar";
import { marService } from "@/lib/services/mar/marService";

export const GET = route({
  resource: "clinical.keperawatan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await marService.get(params.id, actor)),
});

export const POST = route({
  resource: "clinical.keperawatan",
  action: "create",
  params: IdParam,
  body: MarEntryInput,
  handler: async ({ params, body, actor }) =>
    reply(await marService.addEntry(params.id, body, actor), {
      status: 201,
      message: "Pemberian obat dicatat",
    }),
});
