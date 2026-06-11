// API master/layanan-unit (browser) — Mapping Hub Layanan Unit (Tindakan ⇄ Ruangan). Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/master/layanan-unit (+ /:id). Selaras penugasanRuangan.ts.

import { api } from "@/lib/api/client";
import type { GrantLayananInput, LayananUnitEdgeDTO } from "@/lib/schemas/master/layananUnit";

export type { GrantLayananInput, LayananUnitEdgeDTO };

export interface ListLayananParams {
  tindakanId?: string;
  locationId?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/layanan-unit — list/filter edge (cursor pagination). */
export async function listLayanan(
  params: ListLayananParams = {},
  signal?: AbortSignal,
): Promise<{ items: LayananUnitEdgeDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<LayananUnitEdgeDTO[]>("/master/layanan-unit", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge (loop cursor) — matriks butuh map penuh. */
export async function listAllLayanan(signal?: AbortSignal): Promise<LayananUnitEdgeDTO[]> {
  const out: LayananUnitEdgeDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: LayananUnitEdgeDTO[]; cursor: string | null } =
      await listLayanan({ limit: 1000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/layanan-unit — beri layanan (idempoten). */
export async function grantLayanan(input: GrantLayananInput, signal?: AbortSignal): Promise<LayananUnitEdgeDTO> {
  const { data } = await api.post<LayananUnitEdgeDTO>("/master/layanan-unit", input, { signal });
  return data;
}

/** DELETE /master/layanan-unit/:id — cabut layanan. */
export async function revokeLayanan(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/layanan-unit/${encodeURIComponent(id)}`, { signal });
}
