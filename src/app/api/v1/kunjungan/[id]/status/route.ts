// REST: PATCH /api/v1/kunjungan/:id/status — transisi worklist (BACKEND-ENCOUNTER §3).
//   body { action, expectedVersion? } → state machine di Service (version-guarded).
// Authz: gate route = baseline `registration.kunjungan:read` (semua role kunjungan-aware),
//   authz HALUS per-aksi di Service (assertTransitionAllowed) karena action-dependent —
//   `receive`/Terima Pasien boleh klinis (perawat/dokter), transisi lain = loket.
//   scopeKunjungan: clinical actor dibatasi unit kerjanya (anti-IDOR); loket (global) bypass.
import { route } from "@/lib/http/route";
import { IdParam, TransitionInput } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const PATCH = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: true,
  params: IdParam,
  body: TransitionInput,
  handler: ({ params, body, actor }) =>
    kunjunganService.transition(params.id, body.action, body.expectedVersion, actor, {
      bedId: body.bedId,
      waktuSelesai: body.waktuSelesai,
      disposisi: body.disposisi,
      alasanReopen: body.alasanReopen,
    }),
});
