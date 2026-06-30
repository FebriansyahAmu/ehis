// DTO — Asesmen Medis · Alergi · RIWAYAT SEBELUMNYA (longitudinal, read-only).
// Alergi aktif dari kunjungan LAIN pasien (IGD/poli/RI sebelumnya), di-dedup per allergen
// (terbaru menang) + provenance unit/tanggal/pemeriksa. Dipakai panel referensi + "Bawa ke
// RI" (carry-forward → POST ke kunjungan aktif). Payload = superset AlergiItemInput agar
// bisa langsung disalin. Murni baca; tak ada Input (GET).

import type {
  AlergiKategori, AlergiSeverity, AlergiStatus,
} from "@/lib/schemas/asesmenMedis/asesmenAlergi";

export interface AlergiSebelumnyaItemDTO {
  sourceId: string;        // asesmenAlergi.id baris asal (provenance)
  kunjunganId: string;     // kunjungan asal
  noKunjungan: string;
  unit: string;            // IGD | RawatJalan | RawatInap
  unitLabel: string;
  tanggal: string;         // tanggal Jakarta (YYYY-MM-DD)
  pemeriksa: string;
  // payload alergen (mirror AlergiItemInput → siap di-POST saat "Bawa ke RI")
  category: AlergiKategori;
  allergen: string;
  reactions: string[];
  severity: AlergiSeverity;
  status: AlergiStatus;
  keterangan: string | null;
  snomedCode: string | null;
  bzaKode: string | null;
}

export interface AlergiSebelumnyaDTO {
  kunjunganId: string;     // kunjungan aktif (current)
  patientId: string;
  nkaSebelumnya: boolean;  // ada kunjungan lain yang menyatakan NKA
  items: AlergiSebelumnyaItemDTO[]; // dari kunjungan LAIN, dedup per allergen (terbaru)
}
