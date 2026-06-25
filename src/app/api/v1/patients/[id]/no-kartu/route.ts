// REST: GET /api/v1/patients/:id/no-kartu — No. Kartu BPJS PENUH (un-mask) untuk prefilling
// Verifikasi Kepesertaan di loket. Reveal sengaja (DTO pasien selalu mask noKartu); di-gate
// `registration.pasien:read` (operator loket berwenang verifikasi kepesertaan).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/patient";
import { patientService } from "@/lib/services/patientService";

export const GET = route({
  resource: "registration.pasien",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => patientService.revealNoKartu(params.id, actor),
});
