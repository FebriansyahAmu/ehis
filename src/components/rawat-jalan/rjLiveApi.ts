// Adapter worklist API → board RJ. KunjunganListItemDTO (GET /kunjungan) → RJPatient
// (vocab board) + peta status puncak Kunjungan → RJOrderStatus (dipakai statusOverride).

import type { RJPatient, RJPoli, TipePenjamin } from "@/lib/data";
import type { KunjunganListItemDTO } from "@/lib/api/kunjungan";
import type { RJOrderStatus } from "@/lib/rawat-jalan/rjQueueStore";

const RJ_POLI: ReadonlySet<string> = new Set([
  "Poli_Umum", "Poli_Dalam", "Poli_Jantung", "Poli_Paru", "Poli_Bedah",
  "Poli_Saraf", "Poli_Anak", "Poli_THT", "Poli_Mata", "Poli_Obgyn",
]);

function toRJPoli(poli: string | null): RJPoli {
  const k = (poli ?? "").replace(/\s+/g, "_");
  return (RJ_POLI.has(k) ? k : "Poli_Umum") as RJPoli;
}

function ageFrom(iso: string | null): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return Math.max(0, a);
}

function fmtJam(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Status puncak + sub-state panggilan Kunjungan → order board (statusOverride). */
export function orderFromStatus(status: string, callState?: string | null): RJOrderStatus {
  switch (status) {
    case "Registered": return "Order_Masuk";
    case "Queued": return callState === "Dipanggil" ? "Dipanggil" : "Order_Masuk";
    case "InService": return "Dilayani";
    case "Cancelled": return "Dikembalikan_Admisi";
    default: return "Selesai"; // Completed/Closed/Billed/Claimed
  }
}

export function dtoToRJPatient(dto: KunjunganListItemDTO): RJPatient {
  const tgl = dto.pasien.tanggalLahir;
  return {
    id: dto.id,
    noRM: dto.pasien.noRm,
    name: dto.pasien.nama,
    age: ageFrom(tgl),
    gender: dto.pasien.gender,
    tanggalLahir: tgl ?? "",
    poli: toRJPoli(dto.poli),
    dokter: "—", // DPJP master belum di-resolve (dpjpId → nama)
    nomorAntrian: 0,
    status: "Menunggu_Skrining",
    keluhan: dto.keluhan ?? "",
    penjamin: dto.penjaminTipe as TipePenjamin,
    tanggalKunjungan: dto.waktuKunjungan.slice(0, 10),
    waktuDaftar: fmtJam(dto.waktuKunjungan),
  };
}
