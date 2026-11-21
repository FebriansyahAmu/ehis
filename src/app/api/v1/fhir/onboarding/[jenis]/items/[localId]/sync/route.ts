// POST /api/v1/fhir/onboarding/:jenis/items/:localId/sync — kirim/cari 1 data Prerequisites ke SatuSehat
// (logika sama dengan sinkron massal; `force` = kirim ulang walau tak berubah / cari ulang IHS).
// Organization/Location: resolve-first → POST/PUT · Practitioner/Patient: GET by NIK.
// Gagal SatuSehat = hasil `failed` (200), bukan error HTTP. RBAC fhir.sync:create.

import { route, reply } from "@/lib/http/route";
import { OnboardingRunInput, PrereqItemParams } from "@/lib/schemas/fhir/onboarding";
import { sendItem } from "@/lib/services/fhir/onboardingService";

const OUTCOME: Record<string, string> = {
  created: "Terdaftar di SatuSehat",
  updated: "Diperbarui di SatuSehat",
  resolved: "Dipetakan ke SatuSehat",
  unchanged: "Tidak ada perubahan",
  skipped: "Dilewati",
  failed: "Gagal",
};

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  params: PrereqItemParams,
  body: OnboardingRunInput,
  handler: async ({ params, body, actor }) => {
    const r = await sendItem(params.jenis, params.localId, actor, { force: body.force });
    return reply(r, { message: `${OUTCOME[r.item.outcome]} · ${r.item.nama}` });
  },
});
