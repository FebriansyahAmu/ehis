// API bed-allocations (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: /api/v1/bed-allocations. Hanya alokasi AKTIF (Reserved/Occupied).

import { api } from "@/lib/api/client";
import type { BedAllocationDTO } from "@/lib/schemas/bedAllocation";
import type { LocationType } from "@/components/master/ruangan/ruanganShared";

export type { BedAllocationDTO };

/** GET /bed-allocations?locationType= — alokasi bed aktif (untuk tandai bed terisi). */
export async function listActiveBedAllocations(
  locationType?: LocationType,
  signal?: AbortSignal,
): Promise<BedAllocationDTO[]> {
  const { data } = await api.get<BedAllocationDTO[]>("/bed-allocations", {
    query: locationType ? { locationType } : {},
    signal,
  });
  return data;
}
