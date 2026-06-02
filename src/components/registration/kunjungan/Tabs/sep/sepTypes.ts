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
  // Rujukan & poli tujuan (Rawat Jalan) — payload V-Claim t_sep.rujukan / poli / diagAwal.
  asalRujukan: "1" | "2"; tglRujukan: string; noRujukan: string; ppkRujukan: string;
  diagAwal: string; poliTujuan: string;
  // Tujuan kunjungan & prosedur (Rawat Jalan) — payload V-Claim t_sep.
  tujuanKunj: "0" | "1" | "2"; flagProcedure: "" | "0" | "1";
  kdPenunjang: string; assesmentPel: string;
  poliEksekutif: "0" | "1"; dpjpLayan: string;
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
  asalRujukan: "1", tglRujukan: "", noRujukan: "", ppkRujukan: "",
  diagAwal: "", poliTujuan: "",
  tujuanKunj: "0", flagProcedure: "", kdPenunjang: "", assesmentPel: "",
  poliEksekutif: "0", dpjpLayan: "",
  lakaLantas: "0", noLP: "",
  tglKejadian: "", keteranganLaka: "",
  suplesi: "0", noSepSuplesi: "",
  kdPropinsi: "", kdKabupaten: "", kdKecamatan: "",
  cob: "0", katarak: "0",
  skdpNoSurat: "", skdpKodeDPJP: "",
  noTelp: "", catatan: "", user: "",
};

// ─── Tujuan kunjungan / prosedur catalogs (V-Claim) ───────────

export const TUJUAN_KUNJ_OPTS = [
  { value: "0", label: "Normal" },
  { value: "1", label: "Prosedur" },
  { value: "2", label: "Konsul Dokter" },
] as const;

export const FLAG_PROCEDURE_OPTS = [
  { value: "0", label: "Tidak Berkelanjutan" },
  { value: "1", label: "Berkelanjutan" },
];

export const KD_PENUNJANG_OPTS: { value: string; label: string }[] = [
  { value: "1", label: "Radioterapi" },
  { value: "2", label: "Kemoterapi" },
  { value: "3", label: "Rehabilitasi Medik" },
  { value: "4", label: "Rehabilitasi Psikososial" },
  { value: "5", label: "Transfusi Darah" },
  { value: "6", label: "Pelayanan Gigi" },
  { value: "7", label: "Laboratorium" },
  { value: "8", label: "USG" },
  { value: "9", label: "Farmasi" },
  { value: "10", label: "Lain-Lain" },
  { value: "11", label: "MRI" },
  { value: "12", label: "Hemodialisa" },
];

export const ASSESMENT_PEL_OPTS: { value: string; label: string }[] = [
  { value: "1", label: "Poli spesialis tidak tersedia hari sebelumnya" },
  { value: "2", label: "Jam poli telah berakhir hari sebelumnya" },
  { value: "3", label: "Dokter spesialis tidak praktek hari sebelumnya" },
  { value: "4", label: "Atas instruksi RS" },
  { value: "5", label: "Tujuan Kontrol" },
];

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
export const R_TUJUAN_KUNJ = { "0": "Normal", "1": "Prosedur", "2": "Konsul Dokter" } as const;
export const R_ASAL_RUJUKAN = { "1": "Faskes 1 (FKTP)", "2": "Faskes 2 (RS)" } as const;

export const labelOf = (opts: { value: string; label: string }[], v: string): string =>
  opts.find(o => o.value === v)?.label ?? "—";
