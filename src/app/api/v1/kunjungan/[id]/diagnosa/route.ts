// REST: rekam medis — tab Diagnosa (koding ICD-10, per-item).
//   GET  /api/v1/kunjungan/:id/diagnosa → agregat { items[], prosedur[] }
//   POST /api/v1/kunjungan/:id/diagnosa → tambah 1 diagnosis (promosi Utama atomik)

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { DiagnosaItemInput } from "@/lib/schemas/diagnosa/diagnosa";
import { diagnosaService } from "@/lib/services/diagnosa/diagnosaService";

export const GET = route({
  resource: "clinical.diagnosa",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => diagnosaService.get(params.id, actor),
});

export const POST = route({
  resource: "clinical.diagnosa",
  action: "create",
  params: IdParam,
  body: DiagnosaItemInput,
  handler: async ({ params, body, actor }) =>
    reply(await diagnosaService.addDiagnosa(params.id, body, actor), {
      status: 201,
      message: `Diagnosis ${body.kodeIcd10} ditambahkan`,
    }),
});
