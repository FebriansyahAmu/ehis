// REST: /api/v1/master/skala-penyakit — master skala penyakit (klasifikasi/staging klinis).
//   GET  ?q=&modul=&status=&limit=  → list (filter)
//   POST                            → tambah 1 skala (201, kode auto SP-NNNN)
// Schema input/DTO di-reuse dari skala-risiko (category-agnostic). Gate master.skala.

import { route, reply } from "@/lib/http/route";
import { SkalaRisikoQuery, CreateSkalaRisikoInput } from "@/lib/schemas/master/skalaRisiko";
import { skalaPenyakitService } from "@/lib/services/master/skalaPenyakitService";

export const GET = route({
  resource: "master.skala",
  action: "read",
  query: SkalaRisikoQuery,
  handler: async ({ query }) => {
    const { items } = await skalaPenyakitService.list(query);
    return reply(items);
  },
});

export const POST = route({
  resource: "master.skala",
  action: "create",
  body: CreateSkalaRisikoInput,
  handler: async ({ body, actor }) =>
    reply(await skalaPenyakitService.create(body, actor), {
      status: 201,
      message: `Skala "${body.nama}" ditambahkan`,
    }),
});
