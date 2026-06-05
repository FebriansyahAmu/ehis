// REST: /api/v1/auth/users/:id/roles — tetapkan peran + status akun (provisioning).
//   PATCH → replace daftar peran (key) + status opsional.

import { route, reply } from "@/lib/http/route";
import { UserIdParam, AssignRolesInput } from "@/lib/schemas/user";
import { userService } from "@/lib/services/userService";

export const PATCH = route({
  resource: "master.pengguna",
  action: "update",
  params: UserIdParam,
  body: AssignRolesInput,
  handler: async ({ params, body, actor }) => {
    const user = await userService.assignRoles(params.id, body, actor);
    return reply(user, { message: `Peran @${user.username} diperbarui` });
  },
});
