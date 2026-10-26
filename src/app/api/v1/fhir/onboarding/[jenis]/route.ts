// POST /api/v1/fhir/onboarding/:jenis — sinkron onboarding SatuSehat (organization | location |
// practitioner). Urutan wajib: organization → location (butuh managingOrganization) ; practitioner
// bebas. Idempoten (resolve-first + ResourceMap). RBAC: fhir.sync:create.

import { route, reply } from "@/lib/http/route";
import { OnboardingParams, OnboardingRunInput } from "@/lib/schemas/fhir/onboarding";
import { run } from "@/lib/services/fhir/onboardingService";

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  params: OnboardingParams,
  body: OnboardingRunInput,
  handler: async ({ params, body, actor }) => {
    const r = await run(params.jenis, actor, { force: body.force });
    const c = r.counts;
    return reply(r, {
      message: `Sinkron ${params.jenis}: ${c.created} dibuat · ${c.updated} diperbarui · ${c.resolved} dipetakan · ${c.unchanged} tetap · ${c.skipped} dilewati · ${c.failed} gagal`,
    });
  },
});
