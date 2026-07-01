// REST: rekam medis — tab Intake/Output (Balance Cairan).
//   GET  /api/v1/kunjungan/:id/intake-output → { entries, target }
//   POST /api/v1/kunjungan/:id/intake-output → tambah 1 entri cairan (201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, IOEntryInput } from "@/lib/schemas/intakeOutput/intakeOutput";
import { intakeOutputService } from "@/lib/services/intakeOutput/intakeOutputService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await intakeOutputService.get(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: IOEntryInput,
  handler: async ({ params, body, actor }) =>
    reply(await intakeOutputService.addEntry(params.id, body, actor), {
      status: 201,
      message: "Entri intake/output ditambahkan",
    }),
});
