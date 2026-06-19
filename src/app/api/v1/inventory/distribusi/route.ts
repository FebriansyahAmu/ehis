// REST: /api/v1/inventory/distribusi — Distribusi/amprahan (DistribusiRequest).
//   GET  ?status=&fromLocationId=&toLocationId=&cursor=&limit= → list
//   POST { fromLocationId, toLocationId, pemohon, lines[] }     → buat draft (reservasi sumber)
// RBAC: `inventory.distribusi` (read / create). Route tipis.

import { route, paginated, reply } from "@/lib/http/route";
import { DistribusiQuery, CreateDistribusiInput } from "@/lib/schemas/inventory/distribusi";
import { distribusiService } from "@/lib/services/inventory/distribusiService";

export const GET = route({
  resource: "inventory.distribusi",
  action: "read",
  query: DistribusiQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await distribusiService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "inventory.distribusi",
  action: "create",
  body: CreateDistribusiInput,
  handler: async ({ body, actor }) => reply(await distribusiService.create(body, actor), { status: 201, message: "Draft permintaan dibuat — stok sumber direservasi" }),
});
