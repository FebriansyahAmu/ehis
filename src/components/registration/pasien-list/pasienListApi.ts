// Adapter list pasien: PatientDTO (API /api/v1/patients) → PatientMaster (vocab FE).
// Dipakai PasienListPage untuk menampilkan pasien hasil pendaftaran (DB) berdampingan
// dengan demo mock. Kunjungan/billing belum tersedia (Encounter API belum dibangun) →
// dikosongkan; baris tampil "–". Tak ada PII mentah: nik = nikMasked dari server.

import type {
  PatientMaster,
  PenjaminData,
  GolonganDarah,
  StatusPerkawinan,
  TipePenjamin,
} from "@/lib/data";
import type { PatientDTO } from "@/lib/api/patients";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

/** ISO (createdAt / tanggalLahir) → "DD Mon YYYY". String non-ISO dibiarkan apa adanya. */
function formatTanggal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function mapGolDarah(v: string | null): GolonganDarah {
  return v === "A" || v === "B" || v === "AB" || v === "O" ? v : "-";
}

function mapStatusKawin(v: string | null): StatusPerkawinan {
  switch (v) {
    case "Kawin": return "Menikah";
    case "CeraiHidup": return "Janda";
    case "CeraiMati": return "Duda";
    default: return "Belum Menikah";
  }
}

function mapPenjamin(dto: PatientDTO): PenjaminData {
  const pj = dto.penjamin.find((p) => p.isPrimer) ?? dto.penjamin[0];
  if (!pj) return { tipe: "Umum", nama: "Umum / Mandiri" };
  return {
    tipe: pj.tipe as TipePenjamin,
    nama: pj.nama,
    nomor: pj.nomorMasked ?? undefined,
    kelas: (pj.kelas as PenjaminData["kelas"]) ?? undefined,
  };
}

/** PatientDTO → PatientMaster (field cukup untuk list/filter/stats; sisanya default). */
export function dtoToPatientMaster(dto: PatientDTO): PatientMaster {
  const ktp = dto.alamat.find((a) => a.jenis === "KTP") ?? dto.alamat[0] ?? null;
  return {
    id: dto.id,
    noRM: dto.noRm,
    nik: dto.nikMasked ?? "",
    name: dto.nama,
    age: dto.umur ?? 0,
    gender: dto.gender,
    golonganDarah: mapGolDarah(dto.golonganDarah),
    tempatLahir: dto.tempatLahir ?? "",
    tanggalLahir: formatTanggal(dto.tanggalLahir),
    statusPerkawinan: mapStatusKawin(dto.statusPerkawinan),
    agama: dto.agama ?? "",
    pekerjaan: dto.pekerjaan ?? "",
    pendidikan: dto.pendidikan ?? "",
    suku: dto.suku ?? "",
    kewarganegaraan: dto.kewarganegaraan,
    alamat: ktp?.alamat ?? "",
    kelurahan: ktp?.kelurahanNama ?? "",
    kecamatan: ktp?.kecamatanNama ?? "",
    kota: ktp?.kotaNama ?? "",
    provinsi: ktp?.provinsiNama ?? "",
    kodePos: ktp?.kodePos ?? "",
    noHp: dto.noHp ?? "",
    email: dto.email ?? undefined,
    idSatusehat: dto.idSatusehat ?? undefined,
    alergi: dto.alergiAwal.length ? dto.alergiAwal.map((a) => a.nama) : undefined,
    penjamin: mapPenjamin(dto),
    kontakDarurat: dto.kontakDarurat[0]
      ? {
          nama: dto.kontakDarurat[0].nama,
          hubungan: dto.kontakDarurat[0].hubungan,
          noHp: dto.kontakDarurat[0].noHp,
          alamat: dto.kontakDarurat[0].alamat ?? undefined,
        }
      : { nama: "", hubungan: "", noHp: "" },
    // Kunjungan & billing belum tersedia (Encounter/Billing API belum dibangun).
    riwayatKunjungan: [],
    billing: [],
    terdaftar: formatTanggal(dto.createdAt),
  };
}
