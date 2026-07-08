// Adapter detail rekam medis RJ: KunjunganDTO (GET /kunjungan/:id) + PatientDTO
// (GET /patients/:id) → RJPatientDetail (vocab modul rawat-jalan). Dipakai
// RJRecordResolver untuk membuka rekam medis kunjungan DB nyata (id = UUID) yang
// tak ada di mock `rawatJalanPatientDetails`.
//
// Field klinis (TTV/CPPT/diagnosa/riwayat) BELUM ada domain backend → dikosongkan
// (array kosong + TTV nol). Demografi & header diisi dari Pasien + Kunjungan.

import type { RJPatientDetail, RJStatus, IGDVitalSigns, TipePenjamin } from "@/lib/data";
import type { KunjunganDTO } from "@/lib/api/kunjungan";
import type { PatientDTO } from "@/lib/api/patients";
import { toRJPoli, ageFrom, fmtJam } from "./rjLiveApi";

type PatientAddressDTO = PatientDTO["alamat"][number];

const EMPTY_VITALS: IGDVitalSigns = {
  tdSistolik: 0, tdDiastolik: 0, nadi: 0, respirasi: 0, suhu: 0, spo2: 0,
  gcsEye: 0, gcsVerbal: 0, gcsMotor: 0, skalaNyeri: 0,
};

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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

/** Status puncak + sub-state panggilan Kunjungan → status board RJ (detail). */
function rjStatusFrom(status: string, callState: string | null): RJStatus {
  switch (status) {
    case "Registered": return "Menunggu_Skrining";
    case "Queued": return callState === "Dipanggil" ? "Menunggu_Dokter" : "Menunggu_Skrining";
    case "InService": return "Sedang_Diperiksa";
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

export function dtoToRJPatientDetail(
  k: KunjunganDTO, p: PatientDTO, dokterNama?: string,
): RJPatientDetail {
  const alamatKtp = p.alamat.find((a) => a.jenis === "KTP") ?? p.alamat[0];
  const kontak = p.kontakDarurat[0];
  const bpjsPenjamin = p.penjamin.find((j) => isBpjs(j.tipe));
  const noBpjs = bpjsPenjamin?.nomorMasked ?? (k.sep?.noKartu ?? undefined);

  const riwayatAlergi = p.alergiAwal.length
    ? p.alergiAwal.map((a) => (a.reaksi ? `${a.nama} — ${a.reaksi}` : a.nama)).join("\n")
    : undefined;

  return {
    // ── RJPatient (base) ──
    id: k.id,
    noRM: p.noRm,
    name: p.nama,
    age: p.umur ?? ageFrom(p.tanggalLahir),
    gender: p.gender,
    tanggalLahir: fmtTanggalLahir(p.tanggalLahir),
    poli: toRJPoli(k.poli),
    dokter: dokterNama || "—", // DPJP: dpjpId → nama (diresolusi di RJRecordResolver)
    nomorAntrian: 0,
    status: rjStatusFrom(k.status, k.callState),
    keluhan: k.keluhan ?? "",
    penjamin: k.penjaminTipe as TipePenjamin,
    tanggalKunjungan: k.waktuKunjungan.slice(0, 10),
    waktuDaftar: fmtJam(k.waktuKunjungan),

    // ── Demografi (RJPatientDetail) ──
    alamat: composeAlamat(alamatKtp),
    noTelp: p.noHp ?? "—",
    namaKeluarga: kontak?.nama ?? "—",
    hubunganKeluarga: kontak?.hubungan ?? "—",
    noBpjs,
    riwayatAlergi,
    obatSaatIni: undefined,

    // ── Klinis (domain backend belum ada → kosong) ──
    riwayatKunjungan: [],
    vitalSigns: { ...EMPTY_VITALS },
    statusKesadaran: "Compos_Mentis",
    cppt: [],
    diagnosa: [],
  };
}
