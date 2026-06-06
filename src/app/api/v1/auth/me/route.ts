// GET /api/v1/auth/me — sesi + permission efektif (untuk UI gating). 401 bila tak ada sesi nyata.
// actor di-resolve oleh getActor (route()); getSession menolak userId yang bukan akun valid.

import { route } from "@/lib/http/route";
import { authService } from "@/lib/services/authService";

export const GET = route({
  handler: ({ actor }) => authService.getSession(actor.userId),
});
