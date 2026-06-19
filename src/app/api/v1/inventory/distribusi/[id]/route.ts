// REST: /api/v1/inventory/distribusi/:id — detail permintaan distribusi.
// RBAC: `inventory.distribusi:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/distribusi";
import { distribusiService } from "@/lib/services/inventory/distribusiService";

export const GET = route({
  resource: "inventory.distribusi",
  action: "read",
  params: IdParam,
  handler: async ({ params }) => reply(await distribusiService.get(params.id)),
});
