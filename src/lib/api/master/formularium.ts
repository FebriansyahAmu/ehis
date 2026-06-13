// API master/formularium (browser) — Mapping Hub Formularium Unit (Obat ⇄ Ruangan). Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/master/formularium (+ /:id). Bentuk persis layananUnit.ts.

import { api } from "@/lib/api/client";
import type { GrantFormulariumInput, FormulariumEdgeDTO } from "@/lib/schemas/master/formularium";

export type { GrantFormulariumInput, FormulariumEdgeDTO };

export interface ListFormulariumParams {
  obatId?: string;
  locationId?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/formularium — list/filter edge (cursor pagination). */
export async function listFormularium(
  params: ListFormulariumParams = {},
  signal?: AbortSignal,
): Promise<{ items: FormulariumEdgeDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<FormulariumEdgeDTO[]>("/master/formularium", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge (loop cursor) — matriks butuh map penuh. */
export async function listAllFormularium(signal?: AbortSignal): Promise<FormulariumEdgeDTO[]> {
  const out: FormulariumEdgeDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: FormulariumEdgeDTO[]; cursor: string | null } =
      await listFormularium({ limit: 2000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/formularium — beri formularium (idempoten). */
export async function grantFormularium(input: GrantFormulariumInput, signal?: AbortSignal): Promise<FormulariumEdgeDTO> {
  const { data } = await api.post<FormulariumEdgeDTO>("/master/formularium", input, { signal });
  return data;
}

/** DELETE /master/formularium/:id — cabut formularium. */
export async function revokeFormularium(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/formularium/${encodeURIComponent(id)}`, { signal });
}
