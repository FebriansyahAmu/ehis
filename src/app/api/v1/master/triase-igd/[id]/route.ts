// REST: /api/v1/master/triase-igd/:id — detail / ubah / hapus protokol triase.
//   GET    → detail full (matrix).
//   PATCH  → ubah identitas + replace matrix (bila levels/parameters dikirim). Version guard.
//   DELETE → soft-delete (tolak protokol default-aktif). ?expectedVersion= wajib.

import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateTriaseInput, DeleteQuery } from "@/lib/schemas/triaseProtocol";
import { triaseProtocolService } from "@/lib/services/triaseProtocolService";

export const GET = route({
  resource: "master.triase",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => triaseProtocolService.getFull(params.id, actor),
});

export const PATCH = route({
  resource: "master.triase",
  action: "update",
  params: IdParam,
  body: UpdateTriaseInput,
  handler: ({ params, body, actor }) => triaseProtocolService.updateProtocol(params.id, body, actor),
});

export const DELETE = route({
  resource: "master.triase",
  action: "delete",
  params: IdParam,
  query: DeleteQuery,
  handler: async ({ params, query, actor }) => {
    await triaseProtocolService.deleteProtocol(params.id, query.expectedVersion, actor);
    return reply(null, { message: "Protokol triase dihapus" });
  },
});
