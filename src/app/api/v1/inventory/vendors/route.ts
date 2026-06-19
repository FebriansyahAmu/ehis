// REST: /api/v1/inventory/vendors — koleksi Rekanan.
//   GET  ?q=&jenis=&status=&cursor=&limit= → list (cursor pagination)
//   POST { ... }                           → tambah rekanan (kode VND-NNN auto)
// RBAC: `inventory.rekanan` (read / create). Route tipis.

import { route, paginated, reply } from "@/lib/http/route";
import { VendorQuery, CreateVendorInput } from "@/lib/schemas/inventory/vendor";
import { vendorService } from "@/lib/services/inventory/vendorService";

export const GET = route({
  resource: "inventory.rekanan",
  action: "read",
  query: VendorQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await vendorService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "inventory.rekanan",
  action: "create",
  body: CreateVendorInput,
  handler: async ({ body, actor }) => reply(await vendorService.create(body, actor), { status: 201, message: "Rekanan ditambahkan" }),
});
