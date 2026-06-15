// API penilaian skala (browser) — tab Penilaian sub-menu Asesmen Risiko (master-driven).
// Tipe DI-REUSE dari schema server. Dua sisi:
//   1. Katalog instrumen (master, gate klinis): GET /api/v1/master/skala-tersedia?modul=
//   2. Record hasil (per kunjungan, append-only):  /api/v1/kunjungan/:id/penilaian-skala (GET·POST)

import { api } from "@/lib/api/client";
import type {
  PenilaianSkalaInput, PenilaianSkalaDTO,
} from "@/lib/schemas/penilaian/penilaianSkala";
import type { SkalaRisikoDTO } from "@/lib/schemas/master/skalaRisiko";

export type { PenilaianSkalaInput, PenilaianSkalaDTO };
/** Instrumen skala master (bentuk = SkalaRisikoDTO) untuk konsumsi klinis. */
export type SkalaTersediaDTO = SkalaRisikoDTO;

const recordBase = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penilaian-skala`;

/** GET — instrumen skala AKTIF ter-assign unit dari master (kategori Risiko default / Penyakit). */
export async function listSkalaTersedia(
  opts: { modul?: string; kategori?: "Risiko" | "Penyakit" | "Umum" } = {},
  signal?: AbortSignal,
): Promise<SkalaTersediaDTO[]> {
  const params = new URLSearchParams();
  if (opts.modul) params.set("modul", opts.modul);
  if (opts.kategori) params.set("kategori", opts.kategori);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const { data } = await api.get<SkalaTersediaDTO[]>(`/master/skala-tersedia${qs}`, { signal });
  return data;
}

/** GET — riwayat penilaian skala per kunjungan (terbaru dulu). */
export async function getPenilaianSkala(kunjunganId: string, signal?: AbortSignal): Promise<PenilaianSkalaDTO[]> {
  const { data } = await api.get<PenilaianSkalaDTO[]>(recordBase(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 penilaian skala (append-only snapshot). */
export async function createPenilaianSkala(
  kunjunganId: string, input: PenilaianSkalaInput, signal?: AbortSignal,
): Promise<PenilaianSkalaDTO> {
  const { data } = await api.post<PenilaianSkalaDTO>(recordBase(kunjunganId), input, { signal });
  return data;
}
