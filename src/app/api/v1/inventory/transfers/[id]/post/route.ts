// REST: /api/v1/inventory/transfers/:id/post — POSTING transfer → movement TRANSFER (sumber − /
// tujuan +) + lepas reservasi. RBAC: `inventory.pengiriman:update`. Idempoten (tolak bila final).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/transfer";
import { transferService } from "@/lib/services/inventory/transferService";

export const POST = route({
  resource: "inventory.pengiriman",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await transferService.post(params.id, actor), { message: "Transfer diposting — stok dipindahkan" }),
});
