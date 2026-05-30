// ANT1.1 — Kontrak data antrean + TaskID Antrol BPJS.
// Acuan: docs/FLOW-RJ-ONSITE.md · docs/API-ANTREAN.md · contracts/WS-ANTREAN-RS.md.

export type TaskId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 99;

export type JenisPasienAntrean = "Baru" | "Lama";
export type SumberAntrean = "Onsite" | "MJKN" | "Website";
export type CaraBayar = "BPJS" | "Umum";
export type KirimStatus = "pending" | "terkirim" | "gagal";

export type AntreanStatus =
  | "Booked"          // baru ambil antrean (kiosk)
  | "MenungguAdmisi"  // T1 (Baru) — antre ke loket
  | "DipanggilAdmisi" // nomor dipanggil (tanpa task)
  | "DilayaniAdmisi"  // T2 — modal Lengkapi Data dibuka
  | "MenungguPoli"    // T3 — selesai admisi / auto (Lama)
  | "DilayaniPoli"    // T4 — dipanggil poli
  | "MenungguFarmasi" // T5 (ada resep)
  | "Selesai"         // T5 tanpa resep / T7 dengan resep
  | "TidakHadir"      // T99
  | "Batal";          // T99

// TaskLog — satu entri per taskid (idempoten per kodebooking+taskid).
export interface TaskLog {
  taskid: TaskId;
  waktu: number;        // timestamp ms (waktu kejadian asli)
  kirim: KirimStatus;   // status push ke BPJS updatewaktu (outbox)
  attempts: number;
  error?: string;
}

export interface PasienRefAntrean {
  noRM?: string;        // kosong bila pasien baru belum punya norm
  nik?: string;
  nama: string;
  tglLahir?: string;
  kontak?: string;
}

export interface AntreanRecord {
  kodebooking: string;
  tanggal: string;              // display id (hari ini)
  jenisPasien: JenisPasienAntrean;
  sumber: SumberAntrean;
  caraBayar: CaraBayar;
  pasien: PasienRefAntrean;
  noKartu?: string;             // BPJS
  noRujukan?: string;           // rujukan/surat kontrol
  kodepoli?: string;
  poli: string;
  kodedokter?: string;
  dokter: string;
  nomorAntrean: string;         // "A-12"
  angkaAntrean: number;
  estimasiDilayani?: number;    // ms
  status: AntreanStatus;
  tasks: TaskLog[];
  createdAt: number;
}

// Kontrak ringan untuk di-consume modul lain (registrasi/RJ).
export interface AntreanOnlineRef {
  kodebooking: string;
  nomorAntrean: string;
  jamEstimasi?: string;
  taskTerakhir?: TaskId;
  status: AntreanStatus;
}

export interface CreateAntreanInput {
  jenisPasien: JenisPasienAntrean;
  sumber?: SumberAntrean;       // default "Onsite"
  caraBayar: CaraBayar;
  pasien: PasienRefAntrean;
  noKartu?: string;
  noRujukan?: string;
  poli: string;
  kodepoli?: string;
  dokter: string;
  kodedokter?: string;
  estimasiDilayani?: number;
}

// Urutan sah TaskID per jenis pasien (99 boleh kapan saja).
export const TASK_SEQUENCE: Record<JenisPasienAntrean, TaskId[]> = {
  Baru: [1, 2, 3, 4, 5, 6, 7],
  Lama: [3, 4, 5, 6, 7],
};

export const TASK_LABEL: Record<TaskId, string> = {
  1: "Mulai tunggu admisi",
  2: "Mulai layan admisi",
  3: "Selesai admisi / mulai tunggu poli",
  4: "Mulai layan poli (pemanggilan)",
  5: "Selesai poli / mulai tunggu farmasi",
  6: "Mulai layan farmasi",
  7: "Obat selesai",
  99: "Tidak hadir / batal",
};
