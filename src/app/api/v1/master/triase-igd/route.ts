// REST: /api/v1/master/triase-igd — koleksi protokol triase (docs/BACKEND-MASTER-SKALA-KLINIK §A.4.4).
//   GET  → list protokol (full, dgn matrix) untuk halaman master.
//   POST → buat protokol baru.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { CreateTriaseInput } from "@/lib/schemas/triaseProtocol";
import { triaseProtocolService } from "@/lib/services/triaseProtocolService";

export const GET = route({
  resource: "master.triase",
  action: "read",
  handler: ({ actor }) => triaseProtocolService.list(actor),
});

export const POST = route({
  resource: "master.triase",
  action: "create",
  body: CreateTriaseInput,
  handler: async ({ body, actor }) => {
    const p = await triaseProtocolService.createProtocol(body, actor);
    return reply(p, { status: 201, message: `Protokol triase "${p.nama}" dibuat` });
  },
});
