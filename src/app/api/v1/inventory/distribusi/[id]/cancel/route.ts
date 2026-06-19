// REST: /api/v1/inventory/distribusi/:id/cancel — batalkan draft → lepas reservasi.
// RBAC: `inventory.distribusi:update`.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/distribusi";
import { distribusiService } from "@/lib/services/inventory/distribusiService";

export const POST = route({
  resource: "inventory.distribusi",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await distribusiService.cancel(params.id, actor), { message: "Permintaan dibatalkan — reservasi dilepas" }),
});
