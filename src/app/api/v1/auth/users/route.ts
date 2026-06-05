// REST: /api/v1/auth/users — provisioning akun (FLOWS §16). Login/JWT belum dibangun.
//   GET  ?q=&cursor=&limit=  → list akun (cursor pagination)
//   POST                     → buat akun tertaut pegawai (roles di-set via /:id/roles).
// Route TIPIS: auth→RBAC→Zod→envelope→error ditangani route().

import { route, reply, paginated } from "@/lib/http/route";
import { CreateUserInput, ListUsersQuery } from "@/lib/schemas/user";
import { userService } from "@/lib/services/userService";

export const GET = route({
  resource: "master.pengguna",
  action: "read",
  query: ListUsersQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await userService.listUsers(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.pengguna",
  action: "create",
  body: CreateUserInput,
  handler: async ({ body, actor }) => {
    const user = await userService.createUser(body, actor);
    return reply(user, { status: 201, message: `Akun @${user.username} dibuat` });
  },
});
