// REST: PATCH /api/v1/patients/:id/penjamin — ubah jaminan aktif pasien.
//   body { tipe, nomor?, kelas?, noPolis?, nama? } → upsert penjamin + jadikan primer.
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdatePenjaminInput } from "@/lib/schemas/patient";
import { patientService } from "@/lib/services/patientService";

export const PATCH = route({
  resource: "registration.pasien",
  action: "update",
  params: IdParam,
  body: UpdatePenjaminInput,
  handler: async ({ params, body, actor }) => {
    const patient = await patientService.updatePenjamin(params.id, body, actor);
    return reply(patient, { message: `Penjamin ${patient.nama} diperbarui` });
  },
});
