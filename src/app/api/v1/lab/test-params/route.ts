// REST: /api/v1/lab/test-params?ids=a,b,c — parameter katalog (LabTest → LabParameter)
// untuk daftar tes diorder. Dipakai Entry Hasil agar baris hasil = parameter master
// (satuan/rujukan/critical). RBAC: ancillary.lab.worklist:read (analis/SpPK), bukan
// master.katalog → petugas lab boleh baca tanpa hak master. Tanpa params.id → scopeKunjungan:false.

import { route, reply } from "@/lib/http/route";
import { LabTestParamsQuery } from "@/lib/schemas/lab/labOrder";
import { labTestService } from "@/lib/services/master/labTestService";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = route({
  resource: "ancillary.lab.worklist",
  action: "read",
  scopeKunjungan: false,
  query: LabTestParamsQuery,
  handler: async ({ query }) => {
    const ids = query.ids.split(",").map((s) => s.trim()).filter((s) => UUID_RE.test(s));
    return reply(await labTestService.getByIds(ids));
  },
});
