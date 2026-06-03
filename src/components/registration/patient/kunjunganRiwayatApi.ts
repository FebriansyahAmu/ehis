// Adapter timeline pasien: KunjunganListItemDTO (GET /kunjungan?patientId=) →
// KunjunganRecord (vocab FE) untuk card Riwayat di PatientDashboard. Layout sama dgn mock.

import type { KunjunganRecord, UnitKunjungan } from "@/lib/data";
import type { KunjunganListItemDTO } from "@/lib/api/kunjungan";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const UNIT_LABEL: Record<string, UnitKunjungan> = {
  RawatJalan: "Rawat Jalan",
  RawatInap: "Rawat Inap",
  IGD: "IGD",
};

const PENJAMIN_LABEL: Record<string, string> = {
  Umum: "Umum / Mandiri",
  BPJS_Non_PBI: "BPJS Non-PBI",
  BPJS_PBI: "BPJS PBI",
  Asuransi: "Asuransi",
  Jamkesda: "Jamkesda",
};

const STATUS_MAP: Record<string, KunjunganRecord["status"]> = {
  Registered: "Aktif",
  Queued: "Aktif",
  InService: "Aktif",
  Completed: "Selesai",
  Closed: "Selesai",
  Billed: "Selesai",
  Claimed: "Selesai",
  Cancelled: "Dibatalkan",
};

function fmtTglIndo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function dtoToKunjunganRecord(dto: KunjunganListItemDTO): KunjunganRecord {
  return {
    id: dto.id,
    noPendaftaran: dto.noKunjungan,
    noKunjungan: dto.noKunjungan,
    tanggal: fmtTglIndo(dto.waktuKunjungan),
    unit: UNIT_LABEL[dto.unit] ?? "Rawat Jalan",
    dokter: "—",
    keluhan: dto.keluhan ?? "",
    diagnosa: dto.diagnosaMasuk ?? "—",
    penjamin: PENJAMIN_LABEL[dto.penjaminTipe] ?? dto.penjaminTipe,
    noSEP: dto.sep?.noSep ?? undefined,
    kodeICD: dto.kodeIcdMasuk ?? undefined,
    status: STATUS_MAP[dto.status] ?? "Aktif",
  };
}
