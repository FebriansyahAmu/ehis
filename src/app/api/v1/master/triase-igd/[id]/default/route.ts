// REST: /api/v1/master/triase-igd/:id/default — jadikan protokol ini DEFAULT (single-default).
//   PATCH → set isDefault + status Aktif; unset default lain (Service, dalam tx). Version guard.

import { route } from "@/lib/http/route";
import { IdParam, SetDefaultInput } from "@/lib/schemas/triaseProtocol";
import { triaseProtocolService } from "@/lib/services/triaseProtocolService";

export const PATCH = route({
  resource: "master.triase",
  action: "update",
  params: IdParam,
  body: SetDefaultInput,
  handler: ({ params, body, actor }) =>
    triaseProtocolService.setDefault(params.id, body.expectedVersion, actor),
});
