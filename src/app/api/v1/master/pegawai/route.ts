// REST: /api/v1/master/pegawai — koleksi pegawai (FLOWS §16).
//   GET  ?q=&status=&aktif=&cursor=&limit=  → list/cari (cursor pagination)
//   POST                                    → tambah pegawai
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { ListQuery, CreatePegawaiInput } from "@/lib/schemas/pegawai";
import { pegawaiService } from "@/lib/services/pegawaiService";

export const GET = route({
  resource: "master.pegawai",
  action: "read",
  query: ListQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await pegawaiService.listPegawai(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.pegawai",
  action: "create",
  body: CreatePegawaiInput,
  handler: async ({ body, actor }) => {
    const pegawai = await pegawaiService.createPegawai(body, actor);
    return reply(pegawai, { status: 201, message: `Pegawai ${pegawai.namaTampil} ditambahkan` });
  },
});
