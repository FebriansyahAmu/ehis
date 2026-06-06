// REST: GET /api/v1/bed-allocations?status=active&locationType=IGD — alokasi bed AKTIF
// (Reserved/Occupied). Dipakai board IGD / RI untuk menandai bed terisi & hitung tersedia.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route } from "@/lib/http/route";
import { ActiveAllocationQuery } from "@/lib/schemas/bedAllocation";
import { bedAllocationService } from "@/lib/services/bedAllocationService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  query: ActiveAllocationQuery,
  handler: ({ query, actor }) => bedAllocationService.listActive(query, actor),
});
