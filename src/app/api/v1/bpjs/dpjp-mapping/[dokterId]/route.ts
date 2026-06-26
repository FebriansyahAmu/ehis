// PATCH/DELETE /api/v1/bpjs/dpjp-mapping/:dokterId — set / lepas mapping Dokter↔kode DPJP BPJS.
// RBAC: master.mapping:update.

import { route, reply } from "@/lib/http/route";
import { DokterIdParam, SetDpjpMappingInput } from "@/lib/schemas/bpjs/dpjpMapping";
import { setMapping, removeMapping } from "@/lib/services/bpjs/dpjpMappingService";

export const PATCH = route({
  resource: "master.mapping",
  action: "update",
  scopeKunjungan: false,
  params: DokterIdParam,
  body: SetDpjpMappingInput,
  handler: ({ params, body, actor }) =>
    reply(setMapping(params.dokterId, body.refDpjpKode, actor), { message: "Dokter dipetakan ke kode DPJP BPJS" }),
});

export const DELETE = route({
  resource: "master.mapping",
  action: "update",
  scopeKunjungan: false,
  params: DokterIdParam,
  handler: async ({ params }) => {
    await removeMapping(params.dokterId);
    return reply({ dokterId: params.dokterId }, { message: "Mapping DPJP dilepas" });
  },
});
