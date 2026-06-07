// REST: /api/v1/patients/:id — pasien tunggal (FLOWS §16).
//   GET   → detail
//   PATCH → lengkapi data draft (dataLengkap=true) + version guard
import { route, reply } from "@/lib/http/route";
import { IdParam, CompletePatientInput } from "@/lib/schemas/patient";
import { patientService } from "@/lib/services/patientService";

export const GET = route({
  resource: "registration.pasien",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => patientService.getPatient(params.id, actor),
});

export const PATCH = route({
  resource: "registration.pasien",
  action: "update",
  params: IdParam,
  body: CompletePatientInput,
  handler: async ({ params, body, actor }) => {
    const patient = await patientService.completePatient(params.id, body, actor);
    return reply(patient, { message: `Data pasien ${patient.nama} diperbarui` });
  },
});
