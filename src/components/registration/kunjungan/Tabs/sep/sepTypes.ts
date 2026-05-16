// ─── BPJS types ───────────────────────────────────────────────

export interface BpjsData {
  nama: string;
  noKartu: string;
  nik: string;
  jenis: "PBI" | "Non-PBI";
  kelas: "Kelas I" | "Kelas II" | "Kelas III";
  fktp: string;
  status: "Aktif" | "Tidak Aktif";
  berlakuSd: string;
}

export type BpjsMode  = "kartu" | "nik";
export type BpjsPhase = "idle" | "searching" | "found" | "notfound";

export const BPJS_MOCK: Record<string, BpjsData> = {
  "0001234567890": {
    nama: "Joko Prasetyo", noKartu: "0001234567890", nik: "3275011301700001",
    jenis: "Non-PBI", kelas: "Kelas II", fktp: "Puskesmas Cempaka Putih",
    status: "Aktif", berlakuSd: "2027-12-31",
  },
  "3275011301700001": {
    nama: "Joko Prasetyo", noKartu: "0001234567890", nik: "3275011301700001",
    jenis: "Non-PBI", kelas: "Kelas II", fktp: "Puskesmas Cempaka Putih",
    status: "Aktif", berlakuSd: "2027-12-31",
  },
  "0009876543210": {
    nama: "Siti Rahayu", noKartu: "0009876543210", nik: "3275025202920002",
    jenis: "PBI", kelas: "Kelas III", fktp: "Puskesmas Kebun Jeruk",
    status: "Tidak Aktif", berlakuSd: "2024-06-30",
  },
  "3275025202920002": {
    nama: "Siti Rahayu", noKartu: "0009876543210", nik: "3275025202920002",
    jenis: "PBI", kelas: "Kelas III", fktp: "Puskesmas Kebun Jeruk",
    status: "Tidak Aktif", berlakuSd: "2024-06-30",
  },
};

// ─── SEP draft ────────────────────────────────────────────────

export interface SepDraft {
  noKartu: string; namaPeserta: string; klsRawatHak: string; jenisPeserta: string;
  tglSep: string; jnsPelayanan: "1" | "2"; ppkPelayanan: string; noMR: string;
  naikKelas: boolean; klsRawatNaik: string; pembiayaan: string; penanggungJawab: string;
  lakaLantas: "0" | "1" | "2" | "3"; noLP: string;
  tglKejadian: string; keteranganLaka: string;
  suplesi: "0" | "1"; noSepSuplesi: string;
  kdPropinsi: string; kdKabupaten: string; kdKecamatan: string;
  cob: "0" | "1"; katarak: "0" | "1";
  skdpNoSurat: string; skdpKodeDPJP: string;
  noTelp: string; catatan: string; user: string;
}

export const BLANK_DRAFT: SepDraft = {
  noKartu: "", namaPeserta: "", klsRawatHak: "", jenisPeserta: "",
  tglSep: "", jnsPelayanan: "2", ppkPelayanan: "0107R001", noMR: "",
  naikKelas: false, klsRawatNaik: "", pembiayaan: "", penanggungJawab: "",
  lakaLantas: "0", noLP: "",
  tglKejadian: "", keteranganLaka: "",
  suplesi: "0", noSepSuplesi: "",
  kdPropinsi: "", kdKabupaten: "", kdKecamatan: "",
  cob: "0", katarak: "0",
  skdpNoSurat: "", skdpKodeDPJP: "",
  noTelp: "", catatan: "", user: "",
};

// ─── Steps & animation ────────────────────────────────────────

export const SEP_STEPS = [
  { id: 1, label: "Peserta"   },
  { id: 2, label: "Kunjungan" },
  { id: 3, label: "Jaminan"   },
  { id: 4, label: "Review"    },
] as const;

export const SLIDE_VARIANTS = {
  enter:  (d: number) => ({ opacity: 0, x: d * 36 }),
  center: { opacity: 1, x: 0 },
  exit:   (d: number) => ({ opacity: 0, x: d * -36 }),
};

// ─── Input styles ─────────────────────────────────────────────

export const sInp = "h-10 w-full rounded-xl border border-transparent bg-slate-100 px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
export const sSel = "h-10 w-full rounded-xl border border-transparent bg-slate-100 px-3 text-[13px] text-slate-800 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";

// ─── Review lookup tables ─────────────────────────────────────

export const R_JNS  = { "1": "Rawat Inap",  "2": "Rawat Jalan" } as const;
export const R_LAKA = { "0": "BKLL", "1": "KLL + BKK", "2": "KLL + KK", "3": "KK" } as const;
export const R_KLS  = { "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" } as const;
