// API master/formularium-bmhp (browser) — Mapping Hub Ketersediaan Farmasi sub BMHP (BMHP ⇄
// Ruangan). Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/formularium-bmhp (+ /:id).
// Bentuk persis formularium.ts (versi Obat).

import { api } from "@/lib/api/client";
import type { GrantFormulariumBmhpInput, FormulariumBmhpEdgeDTO } from "@/lib/schemas/master/formulariumBmhp";

export type { GrantFormulariumBmhpInput, FormulariumBmhpEdgeDTO };

export interface ListFormulariumBmhpParams {
  bmhpId?: string;
  locationId?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/formularium-bmhp — list/filter edge (cursor pagination). */
export async function listFormulariumBmhp(
  params: ListFormulariumBmhpParams = {},
  signal?: AbortSignal,
): Promise<{ items: FormulariumBmhpEdgeDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<FormulariumBmhpEdgeDTO[]>("/master/formularium-bmhp", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge (loop cursor) — matriks butuh map penuh. */
export async function listAllFormulariumBmhp(signal?: AbortSignal): Promise<FormulariumBmhpEdgeDTO[]> {
  const out: FormulariumBmhpEdgeDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: FormulariumBmhpEdgeDTO[]; cursor: string | null } =
      await listFormulariumBmhp({ limit: 2000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/formularium-bmhp — beri ketersediaan (idempoten). */
export async function grantFormulariumBmhp(input: GrantFormulariumBmhpInput, signal?: AbortSignal): Promise<FormulariumBmhpEdgeDTO> {
  const { data } = await api.post<FormulariumBmhpEdgeDTO>("/master/formularium-bmhp", input, { signal });
  return data;
}

/** DELETE /master/formularium-bmhp/:id — cabut ketersediaan. */
export async function revokeFormulariumBmhp(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/formularium-bmhp/${encodeURIComponent(id)}`, { signal });
}
