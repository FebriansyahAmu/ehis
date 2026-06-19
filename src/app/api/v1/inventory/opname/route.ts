// REST: /api/v1/inventory/opname — Stok Opname (OpnameSession).
//   GET  ?status=&locationId=&cursor=&limit= → list
//   POST { locationId, tanggal? }              → mulai sesi (snapshot saldo lokasi, kode OPN auto)
// RBAC: `inventory.opname` (read / create). Route tipis.

import { route, paginated, reply } from "@/lib/http/route";
import { OpnameQuery, CreateOpnameInput } from "@/lib/schemas/inventory/opname";
import { opnameService } from "@/lib/services/inventory/opnameService";

export const GET = route({
  resource: "inventory.opname",
  action: "read",
  query: OpnameQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await opnameService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "inventory.opname",
  action: "create",
  body: CreateOpnameInput,
  handler: async ({ body, actor }) => reply(await opnameService.create(body, actor), { status: 201, message: "Sesi opname dimulai — saldo lokasi di-snapshot" }),
});
