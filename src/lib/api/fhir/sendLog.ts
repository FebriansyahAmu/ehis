// API log pengiriman SatuSehat per data (browser). Tipe DI-REUSE dari schema server.

import { api } from "@/lib/api/client";
import type { SendLogDetailDTO, SendLogPageDTO, SendLogRowDTO } from "@/lib/schemas/fhir/sendLog";

export type { SendLogDetailDTO, SendLogPageDTO, SendLogRowDTO };

/** Data yang riwayat panggilannya ditampilkan. */
export interface SendLogTarget {
  localType: string;
  localId: string;
  /** Resource klinis: Bundle transaction kunjungan yang memuat data ini ikut ditampilkan. */
  kunjunganId?: string | null;
}

function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function listSendLog(
  t: SendLogTarget,
  p: { cursor?: string | null; limit?: number },
  signal?: AbortSignal,
): Promise<SendLogPageDTO> {
  const { data } = await api.get<SendLogPageDTO>(
    `/fhir/log${qs({ localType: t.localType, localId: t.localId, kunjunganId: t.kunjunganId, cursor: p.cursor, limit: p.limit })}`,
    { signal },
  );
  return data;
}

export async function getSendLog(id: string, focus: SendLogTarget, signal?: AbortSignal): Promise<SendLogDetailDTO> {
  const { data } = await api.get<SendLogDetailDTO>(
    `/fhir/log/${id}${qs({ localType: focus.localType, localId: focus.localId })}`,
    { signal },
  );
  return data;
}
