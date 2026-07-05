// Adapter detail rekam medis Rawat Inap: KunjunganDTO (GET /kunjungan/:id) + PatientDTO
// (GET /patients/:id) → RawatInapPatientDetail (vocab modul RI). Dipakai RIRecordResolver
// untuk membuka rekam medis kunjungan DB nyata (id = UUID) yang tak ada di mock
// `rawatInapPatientDetails`. Pola identik IGD (igdDetailApi).
//
// Field klinis (TTV/CPPT/diagnosa/asuhan/asesmen) BELUM punya rekam awal saat baru diterima
// bangsal → dikosongkan (array kosong + TTV nol) supaya tab persist-by-kunjungan bisa mulai
// pengisian dari nol. Demografi/header/admisi diisi dari Pasien + Kunjungan; ruangan/bed/DPJP/
// kelas diresolusi dari master oleh resolver lalu diteruskan via `opts`.

import type {
  RawatInapPatientDetail, RIKelas, RIStatus, IGDVitalSigns,
} from "@/lib/data";
import type { KunjunganDTO } from "@/lib/api/kunjungan";
import type { PatientDTO } from "@/lib/api/patients";
import { toRIPenjamin, ageFrom, hariKeFrom, isToday } from "./riLandingShared";

type PatientAddressDTO = PatientDTO["alamat"][number];

const EMPTY_VITALS: IGDVitalSigns = {
  tdSistolik: 0, tdDiastolik: 0, nadi: 0, respirasi: 0, suhu: 0, spo2: 0,
  gcsEye: 0, gcsVerbal: 0, gcsMotor: 0, skalaNyeri: 0,
};

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** ISO date-only ("1958-08-15") → "15 Agustus 1958". Split string (hindari shift zona). */
function fmtTanggalLahir(iso: string | null): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "—";
  const [, y, mo, d] = m;
  const idx = Number(mo) - 1;
  if (idx < 0 || idx > 11) return "—";
  return `${Number(d)} ${BULAN[idx]} ${y}`;
}

/** ISO datetime → "3 Mei 2025" (format display AdmitCard). UTC (samakan dengan simpan). */
function fmtTglKunjungan(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Rangkai alamat dari komponen wilayah (KTP diutamakan). */
function composeAlamat(addr: PatientAddressDTO | undefined): string {
  if (!addr) return "—";
  const parts = [
    addr.alamat,
    addr.rtRw ? `RT/RW ${addr.rtRw}` : null,
    addr.kelurahanNama,
    addr.kecamatanNama,
    addr.kotaNama,
    addr.provinsiNama,
    addr.kodePos,
  ].filter((s): s is string => Boolean(s && s.trim()));
  return parts.length ? parts.join(", ") : "—";
}

const isBpjs = (t: string): boolean => t === "BPJS_Non_PBI" || t === "BPJS_PBI";

export interface RIDetailOpts {
  dpjpNama?: string;
  spesialis?: string;
  ruanganNama?: string;
  noBed?: string;
  kelas?: RIKelas;
}

export function dtoToRawatInapPatientDetail(
  k: KunjunganDTO,
  p: PatientDTO,
  opts: RIDetailOpts = {},
): RawatInapPatientDetail {
  const alamatKtp = p.alamat.find((a) => a.jenis === "KTP") ?? p.alamat[0];
  const kontak = p.kontakDarurat[0];
  const bpjsPenjamin = p.penjamin.find((j) => isBpjs(j.tipe));
  const noBpjs = bpjsPenjamin?.nomorMasked ?? k.sep?.noKartu ?? undefined;

  const riwayatAlergi = p.alergiAwal.length
    ? p.alergiAwal.map((a) => (a.reaksi ? `${a.nama} — ${a.reaksi}` : a.nama)).join("\n")
    : undefined;

  const status: RIStatus = k.selesaiAt && isToday(k.selesaiAt) ? "Pulang Hari Ini" : "Aktif";

  return {
    id: k.id,
    noRM: p.noRm,
    noKunjungan: k.noKunjungan,
    name: p.nama,
    age: p.umur ?? ageFrom(p.tanggalLahir),
    gender: p.gender,
    ruangan: opts.ruanganNama ?? "—",
    kelas: opts.kelas ?? "Kelas_3",
    noBed: opts.noBed ?? "—",
    dpjp: opts.dpjpNama?.trim() || "Belum ditetapkan",
    spesialis: opts.spesialis?.trim() || "—",
    diagnosis: k.diagnosaMasuk ?? "—",
    kodeIcd: k.kodeIcdMasuk ?? "—",
    admitDate: k.waktuKunjungan,
    tglMasuk: fmtTglKunjungan(k.waktuKunjungan),
    hariKe: hariKeFrom(k.waktuKunjungan),
    status,
    penjamin: toRIPenjamin(k.penjaminTipe),
    noBpjs,
    noSep: k.sep?.noSep ?? undefined,
    namaKeluarga: kontak?.nama ?? "—",
    hubunganKeluarga: kontak?.hubungan ?? "—",
    tanggalLahir: fmtTanggalLahir(p.tanggalLahir),
    noHp: p.noHp ?? "—",
    alamat: composeAlamat(alamatKtp),
    vitalSigns: { ...EMPTY_VITALS },
    statusKesadaran: "Compos_Mentis",
    ttvHistory: [],
    cppt: [],
    diagnosa: [],
    riwayatAlergi,
    catatan: k.keluhan ?? undefined,
  };
}
