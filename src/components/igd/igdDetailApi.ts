// Adapter detail rekam medis IGD: KunjunganDTO (GET /kunjungan/:id) + PatientDTO
// (GET /patients/:id) → IGDPatientDetail (vocab modul IGD). Dipakai IGDRecordResolver
// untuk membuka rekam medis kunjungan DB nyata (id = UUID) yang tak ada di mock
// `igdPatientDetails`. Pola identik rawat-jalan (rjDetailApi).
//
// Field klinis (TTV/CPPT/diagnosa/tindakan/asesmen) BELUM ada domain backend → dikosongkan
// (array kosong + TTV nol + disposisi null). Demografi & header diisi dari Pasien + Kunjungan.
// DPJP di-resolve dari master Dokter oleh resolver (dpjpId → namaTampil) lalu diteruskan.

import type {
  IGDPatientDetail, IGDStatus, TriageLevel, IGDVitalSigns,
} from "@/lib/data";
import type { KunjunganDTO } from "@/lib/api/kunjungan";
import type { PatientDTO } from "@/lib/api/patients";

type PatientAddressDTO = PatientDTO["alamat"][number];

const EMPTY_VITALS: IGDVitalSigns = {
  tdSistolik: 0, tdDiastolik: 0, nadi: 0, respirasi: 0, suhu: 0, spo2: 0,
  gcsEye: 0, gcsVerbal: 0, gcsMotor: 0, skalaNyeri: 0,
};

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const PENJAMIN_LABEL: Record<string, string> = {
  Umum: "Umum / Mandiri",
  BPJS_Non_PBI: "BPJS Non PBI",
  BPJS_PBI: "BPJS PBI",
  Asuransi: "Asuransi",
  Jamkesda: "Jamkesda",
};

/** ISO date-only ("1967-03-12") → "12 Maret 1967". Split string (hindari shift zona). */
function fmtTanggalLahir(iso: string | null): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "—";
  const [, y, mo, d] = m;
  const idx = Number(mo) - 1;
  if (idx < 0 || idx > 11) return "—";
  return `${Number(d)} ${BULAN[idx]} ${y}`;
}

/** ISO datetime → "14 April 2026" (format display DateCard PatientHeader). UTC (samakan simpan). */
function fmtTglKunjungan(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** ISO datetime → "HH:mm" (UTC, konsisten konvensi simpan wall-clock). */
function fmtJam(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function ageFrom(iso: string | null): number {
  if (!iso) return 0;
  const b = new Date(iso);
  if (Number.isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const mo = now.getMonth() - b.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < b.getDate())) age--;
  return age < 0 ? 0 : age;
}

/** triaseLevel (1..4) → TriageLevel. Null/di luar rentang → undefined (belum ditriase). */
function toTriage(level: number | null): TriageLevel | undefined {
  switch (level) {
    case 1: return "P1";
    case 2: return "P2";
    case 3: return "P3";
    case 4: return "P4";
    default: return undefined;
  }
}

/** Status puncak Kunjungan → status board IGD (detail). */
function igdStatusFrom(status: string): IGDStatus {
  switch (status) {
    case "Registered":
    case "Queued": return "Menunggu";
    case "InService": return "Dalam Penanganan";
    default: return "Selesai"; // Completed/Closed/Billed/Claimed/Cancelled
  }
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

export function dtoToIGDPatientDetail(
  k: KunjunganDTO,
  p: PatientDTO,
  opts?: { dpjpNama?: string },
): IGDPatientDetail {
  const alamatKtp = p.alamat.find((a) => a.jenis === "KTP") ?? p.alamat[0];
  const kontak = p.kontakDarurat[0];
  const bpjsPenjamin = p.penjamin.find((j) => isBpjs(j.tipe));
  const noBpjs = bpjsPenjamin?.nomorMasked ?? k.sep?.noKartu ?? undefined;

  const riwayatAlergi = p.alergiAwal.length
    ? p.alergiAwal.map((a) => (a.reaksi ? `${a.nama} — ${a.reaksi}` : a.nama)).join("\n")
    : undefined;

  return {
    // ── IGDPatient (base) ──
    id: k.id,
    noRM: p.noRm,
    name: p.nama,
    age: p.umur ?? ageFrom(p.tanggalLahir),
    gender: p.gender,
    triage: toTriage(k.triaseLevel),
    status: igdStatusFrom(k.status),
    complaint: k.keluhan ?? "",
    arrivalTime: fmtJam(k.waktuKunjungan),
    waitDuration: "—",
    doctor: opts?.dpjpNama?.trim() || "—",
    ruanganNama: undefined,

    // ── IGDPatientDetail ──
    noKunjungan: k.noKunjungan,
    tglKunjungan: fmtTglKunjungan(k.waktuKunjungan),
    caraMasuk: k.caraMasuk ?? "—",
    penjamin: PENJAMIN_LABEL[k.penjaminTipe] ?? k.penjaminTipe,
    noBpjs,
    tempatLahir: p.tempatLahir ?? "—",
    tanggalLahir: fmtTanggalLahir(p.tanggalLahir),
    alamat: composeAlamat(alamatKtp),
    noHp: p.noHp ?? "—",
    namaKeluarga: kontak?.nama ?? "—",
    hubunganKeluarga: kontak?.hubungan ?? "—",
    vitalSigns: { ...EMPTY_VITALS },
    statusKesadaran: "Compos_Mentis",
    riwayatAlergi,
    obatSaatIni: undefined,

    // ── Klinis (domain backend belum ada → kosong) ──
    riwayatPenyakitSekarang: "",
    pemeriksaanFisikUmum: "",
    asesmenKlinis: "",
    rencanaTatalaksana: "",
    diagnosa: [],
    cppt: [],
    tindakan: [],
    disposisi: null,
  };
}
