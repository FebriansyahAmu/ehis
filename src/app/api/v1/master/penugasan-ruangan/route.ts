// REST: /api/v1/master/penugasan-ruangan — koleksi Penugasan Ruangan (SDM Assignment).
//   GET  ?locationId=&pegawaiId=&cursor=&limit=  → list/filter (cursor pagination)
//   POST { pegawaiId, locationId, peran? }       → tugaskan (idempoten)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { ListQuery, CreatePenugasanInput } from "@/lib/schemas/penugasanRuangan";
import { penugasanRuanganService } from "@/lib/services/penugasanRuanganService";

export const GET = route({
  resource: "master.penugasan-ruangan",
  action: "read",
  query: ListQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await penugasanRuanganService.listPenugasan(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.penugasan-ruangan",
  action: "create",
  body: CreatePenugasanInput,
  handler: async ({ body, actor }) => {
    const { penugasan, created } = await penugasanRuanganService.createPenugasan(body, actor);
    return reply(penugasan, {
      status: created ? 201 : 200,
      message: created
        ? `${penugasan.namaTampil} ditugaskan ke ${penugasan.ruanganNama}`
        : "Penugasan sudah ada",
    });
  },
});
