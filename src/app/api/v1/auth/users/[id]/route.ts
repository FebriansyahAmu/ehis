// REST: /api/v1/auth/users/:id — ubah kredensial akun (provisioning).
//   PATCH → ganti username dan/atau reset password (patch parsial, minimal 1 field).
// Peran + status di endpoint terpisah (/:id/roles). Route TIPIS: auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { UserIdParam, UpdateUserInput } from "@/lib/schemas/user";
import { userService } from "@/lib/services/userService";

export const PATCH = route({
  resource: "master.pengguna",
  action: "update",
  params: UserIdParam,
  body: UpdateUserInput,
  handler: async ({ params, body, actor }) => {
    const user = await userService.updateUser(params.id, body, actor);
    return reply(user, { message: `Akun @${user.username} diperbarui` });
  },
});
