// ANT2 — Seed mock antrean untuk melihat layout board saat ada data.
// Hanya dipakai bila store kosong (lihat seedAntrean di antreanStore). Saat backend
// ready → hapus seed; data nyata datang dari kiosk APM + WS Mobile JKN.

import { DOKTER_ONSITE, getPoli, estimasiDilayani } from "./onsiteMock";
import type {
  AntreanRecord,
  AntreanStatus,
  CaraBayar,
  JenisPasienAntrean,
  PasienRefAntrean,
  SumberAntrean,
  TaskId,
  TaskLog,
} from "./types";

function todayID(): string {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

interface SeedSpec {
  kodebooking: string;
  jenisPasien: JenisPasienAntrean;
  sumber: SumberAntrean;
  caraBayar: CaraBayar;
  pasien: PasienRefAntrean;
  noKartu?: string;
  noRujukan?: string;
  kodedokter: string;
  nomorAntrean: string;
  angkaAntrean: number;
  status: AntreanStatus;
  tasksDone: TaskId[];
  minsAgo: number;
}

const SPECS: SeedSpec[] = [
  {
    kodebooking: "SEED-INT-018",
    jenisPasien: "Lama",
    sumber: "Onsite",
    caraBayar: "BPJS",
    pasien: { noRM: "RM-2025-018", nik: "3171041203680004", nama: "Bambang Sutrisno", tglLahir: "1968-03-12", kontak: "0812-3344-5566" },
    noKartu: "0001234567893",
    noRujukan: "RJKT/0001/0526",
    kodedokter: "D-INT-1",
    nomorAntrean: "I-3",
    angkaAntrean: 3,
    status: "MenungguPoli",
    tasksDone: [3],
    minsAgo: 26,
  },
  {
    kodebooking: "SEED-UMU-007",
    jenisPasien: "Baru",
    sumber: "Onsite",
    caraBayar: "Umum",
    pasien: { nik: "3171042107950002", nama: "Putri Lestari", tglLahir: "1995-07-21", kontak: "0857-1122-3344" },
    kodedokter: "D-UMU-1",
    nomorAntrean: "U-7",
    angkaAntrean: 7,
    status: "MenungguAdmisi",
    tasksDone: [1],
    minsAgo: 9,
  },
  {
    kodebooking: "SEED-ANA-002",
    jenisPasien: "Baru",
    sumber: "Onsite",
    caraBayar: "BPJS",
    pasien: { nik: "3171045503190007", nama: "Rizki Ananda", tglLahir: "2019-03-15", kontak: "0813-9988-7766" },
    noKartu: "0009876543210",
    kodedokter: "D-ANA-1",
    nomorAntrean: "A-2",
    angkaAntrean: 2,
    status: "DipanggilAdmisi",
    tasksDone: [1],
    minsAgo: 13,
  },
  {
    kodebooking: "SEED-MAT-002",
    jenisPasien: "Lama",
    sumber: "MJKN",
    caraBayar: "Umum",
    pasien: { noRM: "RM-2025-021", nik: "3171043005720001", nama: "Slamet Riyadi", tglLahir: "1972-05-30", kontak: "0821-4455-6677" },
    kodedokter: "D-MAT-1",
    nomorAntrean: "M-2",
    angkaAntrean: 2,
    status: "MenungguPoli",
    tasksDone: [3],
    minsAgo: 18,
  },
  {
    kodebooking: "SEED-JAN-001",
    jenisPasien: "Lama",
    sumber: "Website",
    caraBayar: "BPJS",
    pasien: { noRM: "RM-2025-004", nik: "3171040211590003", nama: "Hartati Dewi", tglLahir: "1959-11-02", kontak: "0811-2233-4455" },
    noKartu: "0001234567894",
    noRujukan: "RJKT/0007/0526",
    kodedokter: "D-JAN-1",
    nomorAntrean: "J-1",
    angkaAntrean: 1,
    status: "Selesai",
    tasksDone: [3, 4, 5],
    minsAgo: 95,
  },
];

function build(spec: SeedSpec): AntreanRecord {
  const dokter = DOKTER_ONSITE.find((d) => d.kode === spec.kodedokter)!;
  const poli = getPoli(dokter.poliKode)!;
  const createdAt = Date.now() - spec.minsAgo * 60_000;
  const tasks: TaskLog[] = spec.tasksDone.map((taskid, i) => ({
    taskid,
    waktu: createdAt + i * 1000,
    kirim: "terkirim",
    attempts: 1,
  }));
  return {
    kodebooking: spec.kodebooking,
    tanggal: todayID(),
    jenisPasien: spec.jenisPasien,
    sumber: spec.sumber,
    caraBayar: spec.caraBayar,
    pasien: spec.pasien,
    noKartu: spec.noKartu,
    noRujukan: spec.noRujukan,
    kodepoli: poli.kode,
    poli: poli.nama,
    kodedokter: dokter.kode,
    dokter: dokter.nama,
    nomorAntrean: spec.nomorAntrean,
    angkaAntrean: spec.angkaAntrean,
    estimasiDilayani: estimasiDilayani(dokter, spec.caraBayar),
    status: spec.status,
    tasks,
    createdAt,
  };
}

/** Bangun daftar antrean contoh (urutan apa adanya; board yang menyortir). */
export function buildSeedAntrean(): AntreanRecord[] {
  return SPECS.map(build);
}
