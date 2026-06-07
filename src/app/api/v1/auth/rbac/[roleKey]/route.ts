// REST: /api/v1/auth/rbac/:roleKey — grant satu role.
//   PATCH { kodes: string[] } → REPLACE seluruh grant role (delete-all + insert) + invalidasi cache.
// Gate: master.mapping:update.

import { route, reply } from "@/lib/http/route";
import { RoleKeyParam, UpdateRoleGrantsInput } from "@/lib/schemas/rbac";
import { rbacAdminService } from "@/lib/services/rbacAdminService";

export const PATCH = route({
  resource: "master.mapping",
  action: "update",
  params: RoleKeyParam,
  body: UpdateRoleGrantsInput,
  handler: async ({ params, body }) => {
    const res = await rbacAdminService.updateRoleGrants(params.roleKey, body.kodes);
    return reply(res, { message: `Permission role ${params.roleKey} disimpan (${res.kodes.length} izin)` });
  },
});
