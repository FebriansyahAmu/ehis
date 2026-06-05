// REST: /api/v1/master/dokter — koleksi Dokter (Practitioner) (FLOWS §16 · doc §B.4).
//   GET  ?q=&spesialis=&status=&cursor=&limit=  → list/cari (cursor pagination)
//   POST                                        → provisioning dari pegawai dokter (set pointer)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { ListQuery, CreateDokterInput } from "@/lib/schemas/dokter";
import { dokterService } from "@/lib/services/dokterService";

export const GET = route({
  resource: "master.dokter",
  action: "read",
  query: ListQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await dokterService.listDokter(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.dokter",
  action: "create",
  body: CreateDokterInput,
  handler: async ({ body, actor }) => {
    const dokter = await dokterService.createDokter(body, actor);
    return reply(dokter, { status: 201, message: `Profil dokter ${dokter.namaTampil} dibuat` });
  },
});
