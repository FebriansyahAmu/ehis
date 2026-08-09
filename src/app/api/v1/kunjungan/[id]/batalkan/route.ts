// REST: /api/v1/kunjungan/:id/batalkan — Batalkan Kunjungan (administratif, tab Manajemen).
//   GET  → kelayakan pembatalan (status transisional + rincian aktivitas klinis).
//   POST → batalkan (guard: rekam medis/tindakan/order harus NOL) + simpan alasan.
// Authz: gate route = baseline `registration.kunjungan:read` (pola /status); authz HALUS
//   (write update, atau klinis utk batal order Registered) di Service.assertTransitionAllowed.
//   scopeKunjungan: actor klinis dibatasi unit kerjanya (anti-IDOR); loket/global bypass.
import { route } from "@/lib/http/route";
import { IdParam, CancelKunjunganInput } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: true,
  params: IdParam,
  handler: ({ params, actor }) => kunjunganService.getCancelEligibility(params.id, actor),
});

export const POST = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: true,
  params: IdParam,
  body: CancelKunjunganInput,
  handler: ({ params, body, actor }) => kunjunganService.cancelKunjungan(params.id, body, actor),
});
