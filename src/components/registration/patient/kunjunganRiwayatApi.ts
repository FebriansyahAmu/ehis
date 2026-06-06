// Adapter timeline pasien: KunjunganListItemDTO (GET /kunjungan?patientId=) →
// KunjunganRecord (vocab FE) untuk card Riwayat di PatientDashboard. Layout sama dgn mock.
// + Adapter detail: KunjunganDTO (GET /kunjungan/:id) → KunjunganRecord untuk halaman
//   /pasien/:id/kunjungan/:kunjunganId (Overview/Header). Format & layout identik mock.

import type { KunjunganRecord, KunjunganFase, UnitKunjungan } from "@/lib/data";
import type { KunjunganListItemDTO, KunjunganDTO } from "@/lib/api/kunjungan";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const UNIT_LABEL: Record<string, UnitKunjungan> = {
  RawatJalan: "Rawat Jalan",
  RawatInap: "Rawat Inap",
  IGD: "IGD",
};

// Deep-link "Rekam Medis" (header detail) → worklist klinis unit terkait (by kunjungan id).
const KLINIS_BASE: Record<string, string> = {
  RawatJalan: "/ehis-care/rawat-jalan",
  RawatInap: "/ehis-care/rawat-inap",
  IGD: "/ehis-care/igd",
};

// Link "Lihat Detail" (Riwayat card) → halaman detail kunjungan registrasi (admin).
// Selaras mock: "/ehis-registration/pasien/{noRM}/kunjungan/{id}".
function regDetailPath(noRm: string, id: string): string {
  return `/ehis-registration/pasien/${encodeURIComponent(noRm)}/kunjungan/${id}`;
}

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

// Fase granular (untuk label/badge akurat). Registered/Queued = belum diterima di ruangan;
// InService = sudah diterima (di ruangan). Selesai/batal mengikuti status kasar.
const FASE_MAP: Record<string, KunjunganFase> = {
  Registered: "BelumDiterima",
  Queued: "BelumDiterima",
  InService: "DalamPelayanan",
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
    fase: FASE_MAP[dto.status],
    detailPath: regDetailPath(dto.pasien.noRm, dto.id),
  };
}

// ── Adapter DETAIL (KunjunganDTO penuh) → KunjunganRecord ──────────────────────
// Dipakai halaman /pasien/:id/kunjungan/:kunjunganId. DTO detail lebih kaya dari
// list-item: punya noPendaftaran, caraMasuk, rujukan, sep penuh (noKartu).
// Field yang belum ada sumber DB graceful-fallback:
//   · dokter (DPJP)  → "—"  (G-C: hanya dpjpId/UUID, butuh master Dokter)
//   · dokumen.generalConsent / pengantarPasien → undefined (G-E: schema encounter
//     belum punya kolom dokumen; hanya rujukan yang bisa diturunkan dari relasi).
export function dtoDetailToKunjunganRecord(dto: KunjunganDTO): KunjunganRecord {
  return {
    id: dto.id,
    // G-H: klinisPath = link "Rekam Medis" (header) ke worklist klinis unit.
    noPendaftaran: dto.noPendaftaran ?? dto.noKunjungan,
    noKunjungan: dto.noKunjungan,
    tanggal: fmtTglIndo(dto.waktuKunjungan),
    unit: UNIT_LABEL[dto.unit] ?? "Rawat Jalan",
    dokter: "—",
    keluhan: dto.keluhan ?? "",
    diagnosa: dto.diagnosaMasuk ?? "—",
    penjamin: PENJAMIN_LABEL[dto.penjaminTipe] ?? dto.penjaminTipe,
    // G-D: No. kartu tak diexpose di DTO (enc di PasienPenjamin); turunkan dari SEP.
    noPenjamin: dto.sep?.noKartu ?? undefined,
    noSEP: dto.sep?.noSep ?? undefined,
    kodeICD: dto.kodeIcdMasuk ?? undefined,
    caraMasuk: dto.caraMasuk ?? undefined,
    // G-E: hanya status rujukan yang punya sumber (relasi). Sisanya menyusul.
    dokumen: { rujukan: dto.rujukan ? "Ada" : "Tidak Ada" },
    status: STATUS_MAP[dto.status] ?? "Aktif",
    fase: FASE_MAP[dto.status],
    klinisPath: KLINIS_BASE[dto.unit] ? `${KLINIS_BASE[dto.unit]}/${dto.id}` : undefined,
    detailPath: regDetailPath(dto.pasien.noRm, dto.id),
  };
}
