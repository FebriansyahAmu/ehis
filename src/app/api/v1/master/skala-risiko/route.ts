// REST: /api/v1/master/skala-risiko — master skala risiko (skoring).
//   GET  ?q=&modul=&status=&limit=  → list (filter)
//   POST                            → tambah 1 skala (201, kode auto SR-NNNN)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { SkalaRisikoQuery, CreateSkalaRisikoInput } from "@/lib/schemas/master/skalaRisiko";
import { skalaRisikoService } from "@/lib/services/master/skalaRisikoService";

export const GET = route({
  resource: "master.skala",
  action: "read",
  query: SkalaRisikoQuery,
  handler: async ({ query }) => {
    const { items } = await skalaRisikoService.list(query);
    return reply(items);
  },
});

export const POST = route({
  resource: "master.skala",
  action: "create",
  body: CreateSkalaRisikoInput,
  handler: async ({ body, actor }) =>
    reply(await skalaRisikoService.create(body, actor), {
      status: 201,
      message: `Skala "${body.nama}" ditambahkan`,
    }),
});
