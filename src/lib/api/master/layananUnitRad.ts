// API master/layanan-unit-rad (browser) — Mapping Hub Layanan Unit grup RADIOLOGI (RadCatalog ⇄ Ruangan).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/layanan-unit-rad (+ /:id). Selaras layananUnitLab.ts.

import { api } from "@/lib/api/client";
import type { GrantLayananRadInput, LayananUnitRadEdgeDTO } from "@/lib/schemas/master/layananUnitRad";

export type { GrantLayananRadInput, LayananUnitRadEdgeDTO };

export interface ListLayananRadParams {
  radCatalogId?: string;
  locationId?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/layanan-unit-rad — list/filter edge (cursor pagination). */
export async function listLayananRad(
  params: ListLayananRadParams = {},
  signal?: AbortSignal,
): Promise<{ items: LayananUnitRadEdgeDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<LayananUnitRadEdgeDTO[]>("/master/layanan-unit-rad", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge (loop cursor) — matriks butuh map penuh. */
export async function listAllLayananRad(signal?: AbortSignal): Promise<LayananUnitRadEdgeDTO[]> {
  const out: LayananUnitRadEdgeDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: LayananUnitRadEdgeDTO[]; cursor: string | null } =
      await listLayananRad({ limit: 1000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/layanan-unit-rad — beri layanan (idempoten). */
export async function grantLayananRad(input: GrantLayananRadInput, signal?: AbortSignal): Promise<LayananUnitRadEdgeDTO> {
  const { data } = await api.post<LayananUnitRadEdgeDTO>("/master/layanan-unit-rad", input, { signal });
  return data;
}

/** DELETE /master/layanan-unit-rad/:id — cabut layanan. */
export async function revokeLayananRad(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/layanan-unit-rad/${encodeURIComponent(id)}`, { signal });
}
