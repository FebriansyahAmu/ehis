// Vocab + view-helpers FE Dokter & Nakes. Sumber kontrak = schema server (DTO di-reuse via
// `import type`). Dokter = ekstensi klinis 1:1 Pegawai → identitas (nama/NIK/JK/kontak) READ-ONLY
// dari Pegawai (G4); editable di sini HANYA kredensial klinis. Penugasan poli/unit & jadwal
// praktik BUKAN milik domain ini (poli/unit → Mapping Hub SDM; jadwal → Master Jadwal Dokter
// single-source HFIS) — karena itu tak ada field poliAssignment/jadwal (G5/G6).

import {
  SPESIALIS_LABEL,
  type SpesialisKode,
  type StatusPraktik,
} from "@/lib/schemas/dokter";
import type {
  DokterDTO, DokterListItemDTO, DokterTanpaProfilDTO,
} from "@/lib/api/dokter";

export { SPESIALIS_LABEL };
export type {
  SpesialisKode, StatusPraktik,
  DokterDTO, DokterListItemDTO, DokterTanpaProfilDTO,
};

// Back-compat alias: konsumen lama (katalog-tindakan, konsultasi, mapping kewenangan) pakai
// nama `SpesialisCode`. Identik dengan `SpesialisKode` (vocab server). Jangan dipakai di kode baru.
export type SpesialisCode = SpesialisKode;

// ── Opsi dropdown ─────────────────────────────────────────
export const SPESIALIS_OPTIONS: SpesialisKode[] = [
  "Umum", "SpJP", "SpPD", "SpA", "SpOG", "SpB", "SpAn", "SpS",
  "SpM", "SpEM", "SpKK", "SpKJ", "SpPK", "SpRad", "SpTHT", "SpU",
];

export const STATUS_OPTIONS: StatusPraktik[] = ["Aktif", "Cuti", "Non_Aktif"];

// ── Config tampilan status praktik ────────────────────────
export const STATUS_CFG: Record<
  StatusPraktik,
  { label: string; bg: string; text: string; dot: string }
> = {
  Aktif:     { label: "Aktif",     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Cuti:      { label: "Cuti",      bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  Non_Aktif: { label: "Non-Aktif", bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400" },
};

// ── Form edit kredensial (DokterDetail ⇄ ProfilLisensiTab) ─
// HANYA kredensial klinis — identitas (nama/NIK/JK/kontak) read-only dari Pegawai (G4).
export interface DokterEditForm {
  spesialisKode: SpesialisKode;
  kualifikasi: string;
  noStr: string;
  strBerlakuHingga: string; // ISO yyyy-mm-dd | ""
  noSip: string;
  sipBerlakuHingga: string;
  statusPraktik: StatusPraktik;
  ihsPractitionerId: string;
}

export function dtoToEditForm(d: DokterDTO): DokterEditForm {
  return {
    spesialisKode: d.spesialisKode,
    kualifikasi: d.kualifikasi ?? "",
    noStr: d.noStr ?? "",
    strBerlakuHingga: d.strBerlakuHingga ?? "",
    noSip: d.noSip ?? "",
    sipBerlakuHingga: d.sipBerlakuHingga ?? "",
    statusPraktik: d.statusPraktik,
    ihsPractitionerId: d.ihsPractitionerId ?? "",
  };
}

// ── Helpers ───────────────────────────────────────────────
/** Inisial dari nama tampil (buang prefiks gelar "dr."/"drg." + ambil 2 kata). */
export function namaInitials(nama: string): string {
  return nama
    .replace(/^(dr|drg)\.\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
