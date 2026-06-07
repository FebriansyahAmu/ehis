// REST: /api/v1/auth/rbac — matriks Role×Permission untuk Mapping Hub (RBAC editor).
//   GET → { roles, grants } (kode[] per roleKey).
// Gate: master.mapping (RBAC editor = bagian Mapping Hub). Route tipis via route().

import { route } from "@/lib/http/route";
import { rbacAdminService } from "@/lib/services/rbacAdminService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  handler: () => rbacAdminService.getMatrix(),
});
