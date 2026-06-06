// Adapter: KunjunganListItemDTO (GET /kunjungan?unit=IGD) → IGDPatient (vocab board IGD).
// Field yang belum bersumber DB graceful-kosong (umur bila tglLahir null, DPJP nama, bed) —
// card menampilkan placeholder/"—". Triase bisa null (belum ditriase di loket).

import type { IGDPatient, IGDStatus, TriageLevel } from "@/lib/data";
import type { KunjunganListItemDTO } from "@/lib/api/kunjungan";

const TRIAGE_BY_LEVEL: Record<number, TriageLevel> = { 1: "P1", 2: "P2", 3: "P3", 4: "P4" };

// Status kunjungan DB → status board IGD. Registered/Queued = belum diterima (Menunggu);
// InService = sudah diterima (Dalam Penanganan); selesai/closed → Selesai.
const STATUS_BY_KUNJUNGAN: Record<string, IGDStatus> = {
  Registered: "Menunggu",
  Queued: "Menunggu",
  InService: "Dalam Penanganan",
  Completed: "Selesai",
  Closed: "Selesai",
};

/** Umur (tahun) dari tanggal lahir ISO; undefined bila tak ada → card tampil "—". */
function ageFromDob(dob: string | null): number | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? age : undefined;
}

/** "HH:MM" dari ISO datetime. */
function fmtArrival(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Lama tunggu sejak waktu kunjungan → "X jam Y mnt" / "Y mnt" (kosong bila masa depan/invalid). */
function fmtWait(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Baru saja";
  const jam = Math.floor(mins / 60);
  const mnt = mins % 60;
  if (jam <= 0) return `${mnt} mnt`;
  return mnt > 0 ? `${jam} jam ${mnt} mnt` : `${jam} jam`;
}

/** Peta lookup untuk resolve relasi placeholder kunjungan (id → nama). */
export interface IgdLookups {
  /** Dokter.id → nama tampil (DPJP). */
  dokterById?: Map<string, string>;
  /** Location.id (ruangan IGD) → nama ruangan. */
  ruanganById?: Map<string, string>;
}

/**
 * Map satu kunjungan IGD → kartu pasien board. `lookups` me-resolve DPJP (dpjpId→nama) & ruangan
 * (ruanganId→nama); bila tak tersedia → field kosong (card tampil "—"/"Belum ditentukan").
 */
export function dtoToIgdPatient(dto: KunjunganListItemDTO, lookups?: IgdLookups): IGDPatient {
  return {
    id: dto.id,
    noRM: dto.pasien.noRm,
    name: dto.pasien.nama,
    age: ageFromDob(dto.pasien.tanggalLahir),
    gender: dto.pasien.gender,
    triage: dto.triaseLevel ? TRIAGE_BY_LEVEL[dto.triaseLevel] : undefined,
    status: STATUS_BY_KUNJUNGAN[dto.status] ?? "Menunggu",
    complaint: dto.keluhan ?? "",
    arrivalTime: fmtArrival(dto.waktuKunjungan),
    waitDuration: fmtWait(dto.waktuKunjungan),
    doctor: (dto.dpjpId && lookups?.dokterById?.get(dto.dpjpId)) || "",
    ruanganNama: (dto.ruanganId && lookups?.ruanganById?.get(dto.ruanganId)) || undefined,
  };
}

/** Order IGD yang belum diterima (perlu id+version untuk transisi receive/cancel). */
export interface IgdOrder {
  patient: IGDPatient;
  id: string;
  version: number;
  /** Ruangan IGD terpilih saat daftar → batasi pilihan bed saat Terima. */
  ruanganId: string | null;
}

/**
 * Pisah kunjungan IGD: `orders` (belum diterima: Registered/Queued → inbox) vs
 * `board` (sudah diterima: InService → board pasien).
 */
export function splitIgd(
  items: KunjunganListItemDTO[],
  lookups?: IgdLookups,
): { orders: IgdOrder[]; board: IGDPatient[] } {
  const orders: IgdOrder[] = [];
  const board: IGDPatient[] = [];
  for (const dto of items) {
    if (dto.status === "Registered" || dto.status === "Queued") {
      orders.push({ patient: dtoToIgdPatient(dto, lookups), id: dto.id, version: dto.version, ruanganId: dto.ruanganId });
    } else if (dto.status === "InService") {
      board.push(dtoToIgdPatient(dto, lookups));
    }
  }
  return { orders, board };
}
