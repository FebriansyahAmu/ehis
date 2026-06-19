// REST: /api/v1/inventory/distribusi/:id/fulfill — penuhi permintaan → movement TRANSFER +
// lepas reservasi + isi qtyKeluar. RBAC: `inventory.distribusi:update`. Idempoten (tolak bila final).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/distribusi";
import { distribusiService } from "@/lib/services/inventory/distribusiService";

export const POST = route({
  resource: "inventory.distribusi",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await distribusiService.fulfill(params.id, actor), { message: "Permintaan diproses — barang dikeluarkan" }),
});
