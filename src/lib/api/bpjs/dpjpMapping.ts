// API client (browser) — Mapping Hub "DPJP BPJS". Tipe DI-REUSE dari schema.

import { api } from "@/lib/api/client";
import type {
  DpjpBoardRow, RefDpjpOption, RefDpjpQuery, SyncRefResult,
} from "@/lib/schemas/bpjs/dpjpMapping";

export type { DpjpBoardRow, RefDpjpOption, SyncRefResult };

/** GET — board dokter RS + status mapping. */
export async function listDpjpBoard(signal?: AbortSignal): Promise<DpjpBoardRow[]> {
  const { data } = await api.get<DpjpBoardRow[]>("/bpjs/dpjp-mapping", { signal });
  return data;
}

/** GET — picker referensi DPJP BPJS. */
export async function searchRefDpjp(q: RefDpjpQuery = {}, signal?: AbortSignal): Promise<RefDpjpOption[]> {
  const { data } = await api.get<RefDpjpOption[]>("/bpjs/ref-dpjp", {
    query: { search: q.search, kodeSpesialis: q.kodeSpesialis, limit: q.limit },
    signal,
  });
  return data;
}

/** PATCH — petakan dokter ↔ kode DPJP BPJS. */
export async function setDpjpMapping(dokterId: string, refDpjpKode: string, signal?: AbortSignal) {
  const { data } = await api.patch<{ dokterId: string; refDpjpKode: string }>(
    `/bpjs/dpjp-mapping/${encodeURIComponent(dokterId)}`,
    { refDpjpKode },
    { signal },
  );
  return data;
}

/** DELETE — lepas mapping. */
export async function removeDpjpMapping(dokterId: string, signal?: AbortSignal) {
  const { data } = await api.del<{ dokterId: string }>(
    `/bpjs/dpjp-mapping/${encodeURIComponent(dokterId)}`,
    { signal },
  );
  return data;
}

/** POST — jalankan sync referensi BPJS (mock=seed demo). */
export async function syncDpjpReferences(signal?: AbortSignal): Promise<SyncRefResult> {
  const { data } = await api.post<SyncRefResult>("/bpjs/admin/sync-references", {}, { signal });
  return data;
}
