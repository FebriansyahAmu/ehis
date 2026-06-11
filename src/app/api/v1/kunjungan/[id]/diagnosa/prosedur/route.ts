// REST: rekam medis — tab Diagnosa · prosedur ICD-9-CM (per-item).
//   POST /api/v1/kunjungan/:id/diagnosa/prosedur → tambah 1 prosedur

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { ProsedurItemInput } from "@/lib/schemas/diagnosa/diagnosa";
import { diagnosaService } from "@/lib/services/diagnosa/diagnosaService";

export const POST = route({
  // Prosedur ICD-9-CM punya resource sendiri (≠ clinical.diagnosa/ICD-10) agar bisa diberikan
  // ke Perawat tanpa membuka hak tulis diagnosis ICD-10. ABAC careUnit tetap berlaku (clinical.*).
  resource: "clinical.prosedur",
  action: "create",
  params: IdParam,
  body: ProsedurItemInput,
  handler: async ({ params, body, actor }) =>
    reply(await diagnosaService.addProsedur(params.id, body, actor), {
      status: 201,
      message: `Prosedur ${body.kode} ditambahkan`,
    }),
});
