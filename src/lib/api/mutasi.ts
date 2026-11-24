// Client mutasi pasien (pindah ruangan/bed dalam kunjungan — IGD · Rawat Inap).
// Mutasi selesai → emit recordBus "lokasi" (header ruangan/bed dimuat ulang) + "order" (akomodasi
// RI ikut kelas kamar baru di proyeksi tagihan).

import { api } from "./client";
import { emitRecordChange } from "@/lib/realtime/recordBus";
import type {
  AjukanMutasiInput, BatalMutasiInput, LembarTransferInput, MutasiDTO, MutasiOpsiDTO, MutasiStateDTO,
} from "@/lib/schemas/mutasi";

export type {
  AjukanMutasiInput, BatalMutasiInput, BedState, LembarTransferData, LembarTransferInput, LokasiDTO,
  MutasiBedDTO, MutasiDTO, MutasiOpsiDTO, MutasiRoomDTO, MutasiStateDTO, MutasiStatus,
} from "@/lib/schemas/mutasi";
export {
  ALAT_TERPASANG, DOKUMEN_DIBAWA, KESADARAN, KONDISI_UMUM, PENDAMPING, RISIKO,
} from "@/lib/schemas/mutasi";

const base = (kunjunganId: string) => `/kunjungan/${encodeURIComponent(kunjunganId)}/mutasi`;

export async function getMutasiState(kunjunganId: string, signal?: AbortSignal): Promise<MutasiStateDTO> {
  return (await api.get<MutasiStateDTO>(base(kunjunganId), { signal })).data;
}

export async function getMutasiOpsi(kunjunganId: string, signal?: AbortSignal): Promise<MutasiOpsiDTO> {
  return (await api.get<MutasiOpsiDTO>(`${base(kunjunganId)}/opsi`, { signal })).data;
}

export async function ajukanMutasi(kunjunganId: string, input: AjukanMutasiInput): Promise<MutasiDTO> {
  return (await api.post<MutasiDTO>(base(kunjunganId), input)).data;
}

export async function selesaikanMutasi(kunjunganId: string, mutasiId: string): Promise<MutasiDTO> {
  const r = (await api.post<MutasiDTO>(`${base(kunjunganId)}/${encodeURIComponent(mutasiId)}/selesai`)).data;
  emitRecordChange(kunjunganId, "lokasi");
  emitRecordChange(kunjunganId, "order");
  return r;
}

export async function batalkanMutasi(kunjunganId: string, mutasiId: string, input: BatalMutasiInput): Promise<MutasiDTO> {
  return (await api.post<MutasiDTO>(`${base(kunjunganId)}/${encodeURIComponent(mutasiId)}/batal`, input)).data;
}

export async function simpanLembarTransfer(kunjunganId: string, mutasiId: string, input: LembarTransferInput): Promise<MutasiDTO> {
  return (await api.post<MutasiDTO>(`${base(kunjunganId)}/${encodeURIComponent(mutasiId)}/lembar-transfer`, input)).data;
}
