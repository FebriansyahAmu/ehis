// REST: /api/v1/master/ruangan — koleksi Ruangan + pohon Sumber Daya (BACKEND-MASTER-SUMBER-DAYA §A.4.4).
//   GET ?view=tree        → seluruh pohon (Unit + Ruangan datar, Bed nested) untuk Unified Tree FE.
//   GET ?locationType=IGD → list datar Ruangan satu tipe (lookup pendaftaran, anti over-fetch).
//   POST                  → buat Ruangan (Location) di bawah sebuah Unit.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { RuanganQuery, CreateRuanganInput } from "@/lib/schemas/ruangan";
import { ruanganService } from "@/lib/services/ruanganService";

export const GET = route({
  resource: "master.ruangan",
  action: "read",
  query: RuanganQuery,
  handler: ({ query, actor }) =>
    query.locationType
      ? ruanganService.listRuanganByType(query.locationType, actor)
      : ruanganService.getTree(actor),
});

export const POST = route({
  resource: "master.ruangan",
  action: "create",
  body: CreateRuanganInput,
  handler: async ({ body, actor }) => {
    const loc = await ruanganService.createRuangan(body, actor);
    return reply(loc, { status: 201, message: `Ruangan ${loc.name} dibuat` });
  },
});
