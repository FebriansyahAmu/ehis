// API master/layanan-unit-lab (browser) — Mapping Hub Layanan Unit grup LAB (LabTest ⇄ Ruangan).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/layanan-unit-lab (+ /:id).
// Selaras layananUnit.ts.

import { api } from "@/lib/api/client";
import type { GrantLayananLabInput, LayananUnitLabEdgeDTO } from "@/lib/schemas/master/layananUnitLab";

export type { GrantLayananLabInput, LayananUnitLabEdgeDTO };

export interface ListLayananLabParams {
  labTestId?: string;
  locationId?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/layanan-unit-lab — list/filter edge (cursor pagination). */
export async function listLayananLab(
  params: ListLayananLabParams = {},
  signal?: AbortSignal,
): Promise<{ items: LayananUnitLabEdgeDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<LayananUnitLabEdgeDTO[]>("/master/layanan-unit-lab", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge (loop cursor) — matriks butuh map penuh. */
export async function listAllLayananLab(signal?: AbortSignal): Promise<LayananUnitLabEdgeDTO[]> {
  const out: LayananUnitLabEdgeDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: LayananUnitLabEdgeDTO[]; cursor: string | null } =
      await listLayananLab({ limit: 1000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/layanan-unit-lab — beri layanan (idempoten). */
export async function grantLayananLab(input: GrantLayananLabInput, signal?: AbortSignal): Promise<LayananUnitLabEdgeDTO> {
  const { data } = await api.post<LayananUnitLabEdgeDTO>("/master/layanan-unit-lab", input, { signal });
  return data;
}

/** DELETE /master/layanan-unit-lab/:id — cabut layanan. */
export async function revokeLayananLab(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/layanan-unit-lab/${encodeURIComponent(id)}`, { signal });
}
