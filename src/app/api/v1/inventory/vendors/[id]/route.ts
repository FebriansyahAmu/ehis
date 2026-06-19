// REST: /api/v1/inventory/vendors/:id — rekanan tunggal.
//   PATCH  → ubah · DELETE → soft-delete.
// RBAC: `inventory.rekanan` (update / delete). Route tipis.

import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateVendorInput } from "@/lib/schemas/inventory/vendor";
import { vendorService } from "@/lib/services/inventory/vendorService";

export const PATCH = route({
  resource: "inventory.rekanan",
  action: "update",
  params: IdParam,
  body: UpdateVendorInput,
  handler: async ({ params, body, actor }) => reply(await vendorService.update(params.id, body, actor), { message: "Rekanan diperbarui" }),
});

export const DELETE = route({
  resource: "inventory.rekanan",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await vendorService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Rekanan dihapus" });
  },
});
