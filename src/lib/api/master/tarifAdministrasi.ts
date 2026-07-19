// API master/tarif-administrasi (browser) — Mapping Hub → Tarif Administrasi (Unit × Penjamin).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/tarif-administrasi (+ /:id). Paralel tarifKamar.ts.

import { api } from "@/lib/api/client";
import type { UpsertTarifAdministrasiInput, TarifAdministrasiDTO } from "@/lib/schemas/master/tarifAdministrasi";

export type { UpsertTarifAdministrasiInput, TarifAdministrasiDTO };

export interface ListTarifAdministrasiParams {
  unit?: string;
  penjaminKode?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/tarif-administrasi — list/filter (cursor pagination). */
export async function listTarifAdministrasi(
  params: ListTarifAdministrasiParams = {},
  signal?: AbortSignal,
): Promise<{ items: TarifAdministrasiDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<TarifAdministrasiDTO[]>("/master/tarif-administrasi", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA tarif administrasi (loop cursor) — grid butuh map penuh. */
export async function listAllTarifAdministrasi(signal?: AbortSignal): Promise<TarifAdministrasiDTO[]> {
  const out: TarifAdministrasiDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: TarifAdministrasiDTO[]; cursor: string | null } =
      await listTarifAdministrasi({ limit: 500, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/tarif-administrasi — set biaya (upsert by pair). */
export async function upsertTarifAdministrasi(input: UpsertTarifAdministrasiInput, signal?: AbortSignal): Promise<TarifAdministrasiDTO> {
  const { data } = await api.post<TarifAdministrasiDTO>("/master/tarif-administrasi", input, { signal });
  return data;
}

/** DELETE /master/tarif-administrasi/:id — cabut tarif (→ belum diisi). */
export async function deleteTarifAdministrasi(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/tarif-administrasi/${encodeURIComponent(id)}`, { signal });
}
