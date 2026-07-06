// API Jadwal Kontrol (browser) — tab Pasien Pulang RI, sub Obat & Jadwal. Tipe DI-REUSE dari
// schema server. Endpoint: /api/v1/kunjungan/:id/jadwal-kontrol (GET/POST · DELETE /:itemId).
// Nomor = auto sistem; No. Referensi = noSuratKontrol response V-Claim RencanaKontrol/insert.

import { api } from "@/lib/api/client";
import type {
  JadwalKontrolInput, JadwalKontrolEditInput, JadwalKontrolDTO, SepTerbitDTO,
} from "@/lib/schemas/jadwalKontrol/jadwalKontrol";

export type { JadwalKontrolInput, JadwalKontrolEditInput, JadwalKontrolDTO, SepTerbitDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/jadwal-kontrol`;

/** GET — SEP TERBIT milik pasien (lintas kunjungan, terbaru dulu) utk picker No. SEP. */
export async function listSepTerbit(
  kunjunganId: string, signal?: AbortSignal,
): Promise<SepTerbitDTO[]> {
  const { data } = await api.get<SepTerbitDTO[]>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/sep-terbit`, { signal },
  );
  return data;
}

/** GET — jadwal kontrol aktif per kunjungan (terbaru dulu). */
export async function listJadwalKontrol(
  kunjunganId: string, signal?: AbortSignal,
): Promise<JadwalKontrolDTO[]> {
  const { data } = await api.get<JadwalKontrolDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — terbitkan jadwal kontrol (BPJS → server kirim RencanaKontrol/insert). */
export async function createJadwalKontrol(
  kunjunganId: string, input: JadwalKontrolInput, signal?: AbortSignal,
): Promise<JadwalKontrolDTO> {
  const { data } = await api.post<JadwalKontrolDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** PATCH — perbarui jadwal (noSuratKontrol SAMA; BPJS → server kirim RencanaKontrol/Update). */
export async function updateJadwalKontrol(
  kunjunganId: string, itemId: string, input: JadwalKontrolEditInput, signal?: AbortSignal,
): Promise<JadwalKontrolDTO> {
  const { data } = await api.patch<JadwalKontrolDTO>(
    `${base(kunjunganId)}/${encodeURIComponent(itemId)}`, input, { signal },
  );
  return data;
}

/** DELETE — batalkan jadwal (ber-referensi → RencanaKontrol/Delete ke BPJS dulu). */
export async function deleteJadwalKontrol(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
