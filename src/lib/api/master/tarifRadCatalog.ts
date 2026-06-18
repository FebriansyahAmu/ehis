// API master/tarif-rad-catalog (browser) — Mapping Hub Tarif Matrix, grup Rad (RadCatalog × Penjamin × Jenis Ruangan).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/tarif-rad-catalog (+ /:id). Paralel tarifLabTest.ts.

import { api } from "@/lib/api/client";
import type { UpsertTarifRadInput, TarifRadCatalogDTO } from "@/lib/schemas/master/tarifRadCatalog";

export type { UpsertTarifRadInput, TarifRadCatalogDTO };

export interface ListTarifRadParams {
  radCatalogId?: string;
  penjaminKode?: string;
  jenisRuangan?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/tarif-rad-catalog — list/filter edge tarif rad (cursor pagination). */
export async function listTarifRad(
  params: ListTarifRadParams = {},
  signal?: AbortSignal,
): Promise<{ items: TarifRadCatalogDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<TarifRadCatalogDTO[]>("/master/tarif-rad-catalog", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge tarif rad (loop cursor) — matriks butuh map penuh. */
export async function listAllTarifRad(signal?: AbortSignal): Promise<TarifRadCatalogDTO[]> {
  const out: TarifRadCatalogDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: TarifRadCatalogDTO[]; cursor: string | null } =
      await listTarifRad({ limit: 2000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/tarif-rad-catalog — set harga (upsert by triple). */
export async function upsertTarifRad(input: UpsertTarifRadInput, signal?: AbortSignal): Promise<TarifRadCatalogDTO> {
  const { data } = await api.post<TarifRadCatalogDTO>("/master/tarif-rad-catalog", input, { signal });
  return data;
}

/** DELETE /master/tarif-rad-catalog/:id — cabut tarif (→ belum diisi). */
export async function deleteTarifRad(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/tarif-rad-catalog/${encodeURIComponent(id)}`, { signal });
}
