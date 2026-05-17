// Register Narkotika & Psikotropika — UU 35/2009 · UU 5/1997 · PMK 3/2015

export type NarPsiKategori  = "Narkotika" | "Psikotropika";
export type NarPsiJenisMutasi = "Keluar" | "Masuk" | "Opname";

export interface NarPsiDrug {
  id:        string;
  nama:      string;
  kekuatan:  string;    // "10 mg/mL"
  satuan:    string;    // "Ampul" | "Tablet"
  kategori:  NarPsiKategori;
  stokAwal:  number;    // per bulan ini
  stokMin:   number;
}

export interface RegisterEntry {
  id:          string;
  noUrut:      number;
  tanggal:     string;       // "YYYY-MM-DD"
  jam:         string;       // "HH:MM"
  namaObat:    string;
  kekuatan:    string;
  noRM?:       string;
  namaPasien?: string;
  dokter?:     string;
  noResep?:    string;
  jumlahKeluar: number;
  jumlahMasuk:  number;
  saldo:        number;
  pengambil:    string;      // perawat/apoteker
  keterangan?:  string;
  jenis:        NarPsiJenisMutasi;
  bulan:        string;      // "2025-05"
  depo:         string;
}

export interface StokOpnameEntry {
  id:           string;
  tanggal:      string;
  namaObat:     string;
  stokSistem:   number;
  stokFisik:    number;
  selisih:      number;
  petugas:      string;
  catatan?:     string;
}

// ── Drug catalog ──────────────────────────────────────────

export const NARKOTIKA_DRUGS: NarPsiDrug[] = [
  { id: "n-01", nama: "Morfin Sulfat",    kekuatan: "10 mg/mL",  satuan: "Ampul",   kategori: "Narkotika",    stokAwal: 50,  stokMin: 5  },
  { id: "n-02", nama: "Fentanil",         kekuatan: "50 mcg/mL", satuan: "Ampul",   kategori: "Narkotika",    stokAwal: 30,  stokMin: 5  },
  { id: "n-03", nama: "Petidin",          kekuatan: "50 mg/mL",  satuan: "Ampul",   kategori: "Narkotika",    stokAwal: 20,  stokMin: 3  },
  { id: "n-04", nama: "Kodein",           kekuatan: "10 mg",     satuan: "Tablet",  kategori: "Narkotika",    stokAwal: 100, stokMin: 10 },
  { id: "n-05", nama: "Tramadol",         kekuatan: "50 mg",     satuan: "Kapsul",  kategori: "Narkotika",    stokAwal: 200, stokMin: 20 },
];

export const PSIKOTROPIKA_DRUGS: NarPsiDrug[] = [
  { id: "p-01", nama: "Diazepam",         kekuatan: "5 mg/mL",   satuan: "Ampul",   kategori: "Psikotropika", stokAwal: 40,  stokMin: 5  },
  { id: "p-02", nama: "Midazolam",        kekuatan: "5 mg/mL",   satuan: "Ampul",   kategori: "Psikotropika", stokAwal: 35,  stokMin: 5  },
  { id: "p-03", nama: "Lorazepam",        kekuatan: "2 mg/mL",   satuan: "Ampul",   kategori: "Psikotropika", stokAwal: 25,  stokMin: 3  },
  { id: "p-04", nama: "Alprazolam",       kekuatan: "0.5 mg",    satuan: "Tablet",  kategori: "Psikotropika", stokAwal: 150, stokMin: 15 },
  { id: "p-05", nama: "Fenobarbital",     kekuatan: "30 mg",     satuan: "Tablet",  kategori: "Psikotropika", stokAwal: 80,  stokMin: 10 },
];

export const ALL_NARPSI_DRUGS = [...NARKOTIKA_DRUGS, ...PSIKOTROPIKA_DRUGS];

// ── Mock register data ─────────────────────────────────────
// Auto-derived from farmasi orders + seeding entries

export const REGISTER_MOCK: RegisterEntry[] = [
  // ── Narkotika – Morfin Sulfat ─────────────────────────
  { id: "rn-001", noUrut: 1,  tanggal: "2025-05-01", jam: "08:30", namaObat: "Morfin Sulfat",  kekuatan: "10 mg/mL",  jumlahMasuk: 50, jumlahKeluar: 0, saldo: 50, pengambil: "Apt. Dewi Kusuma, S.Farm", keterangan: "Penerimaan dari gudang farmasi - DO #GF-20250501-003", jenis: "Masuk",  bulan: "2025-05", depo: "Apotek RI",  noRM: undefined, namaPasien: undefined, dokter: undefined, noResep: undefined },
  { id: "rn-002", noUrut: 2,  tanggal: "2025-05-03", jam: "09:15", namaObat: "Morfin Sulfat",  kekuatan: "10 mg/mL",  jumlahMasuk: 0,  jumlahKeluar: 2, saldo: 48, pengambil: "Ns. Siti Rahayu, S.Kep",  keterangan: "Paliatif – nyeri kronik sedang",         jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-003", namaPasien: "Ahmad Fauzi",   dokter: "dr. Dewi Kusuma, Sp.JP",  noResep: "RX/2025/05/003" },
  { id: "rn-003", noUrut: 3,  tanggal: "2025-05-05", jam: "08:05", namaObat: "Morfin Sulfat",  kekuatan: "10 mg/mL",  jumlahMasuk: 0,  jumlahKeluar: 1, saldo: 47, pengambil: "Ns. Ahmad Ridwan, S.Kep",  keterangan: "Manajemen nyeri post-operatif",          jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-007", namaPasien: "Hasan Basri",   dokter: "dr. Hendra Wijaya, Sp.EM", noResep: "RX/2025/05/007" },
  { id: "rn-004", noUrut: 4,  tanggal: "2025-05-07", jam: "10:20", namaObat: "Morfin Sulfat",  kekuatan: "10 mg/mL",  jumlahMasuk: 0,  jumlahKeluar: 1, saldo: 46, pengambil: "Ns. Ahmad Ridwan, S.Kep",  keterangan: "",                                      jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-007", namaPasien: "Hasan Basri",   dokter: "dr. Hendra Wijaya, Sp.EM", noResep: "RX/2025/05/011" },
  { id: "rn-005", noUrut: 5,  tanggal: "2025-05-10", jam: "11:00", namaObat: "Morfin Sulfat",  kekuatan: "10 mg/mL",  jumlahMasuk: 0,  jumlahKeluar: 2, saldo: 44, pengambil: "Ns. Dini Amalia, S.Kep",   keterangan: "",                                      jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-003", namaPasien: "Ahmad Fauzi",   dokter: "dr. Dewi Kusuma, Sp.JP",  noResep: "RX/2025/05/015" },

  // ── Narkotika – Fentanil ──────────────────────────────
  { id: "rn-010", noUrut: 1,  tanggal: "2025-05-01", jam: "08:35", namaObat: "Fentanil",        kekuatan: "50 mcg/mL", jumlahMasuk: 30, jumlahKeluar: 0, saldo: 30, pengambil: "Apt. Dewi Kusuma, S.Farm", keterangan: "Penerimaan dari gudang farmasi - DO #GF-20250501-003", jenis: "Masuk",  bulan: "2025-05", depo: "Apotek RI",  noRM: undefined, namaPasien: undefined, dokter: undefined, noResep: undefined },
  { id: "rn-011", noUrut: 2,  tanggal: "2025-05-05", jam: "09:00", namaObat: "Fentanil",        kekuatan: "50 mcg/mL", jumlahMasuk: 0,  jumlahKeluar: 3, saldo: 27, pengambil: "Ns. Ahmad Ridwan, S.Kep",  keterangan: "Sedasi ICU – titrasi",                  jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-007", namaPasien: "Hasan Basri",   dokter: "dr. Hendra Wijaya, Sp.EM", noResep: "RX/2025/05/007" },
  { id: "rn-012", noUrut: 3,  tanggal: "2025-05-09", jam: "14:30", namaObat: "Fentanil",        kekuatan: "50 mcg/mL", jumlahMasuk: 0,  jumlahKeluar: 2, saldo: 25, pengambil: "Ns. Rina Wahyuni, S.Kep",  keterangan: "Premedikasi operasi",                   jenis: "Keluar", bulan: "2025-05", depo: "Kamar Bedah", noRM: "RM-2025-019", namaPasien: "Slamet Riyadi", dokter: "dr. Fajar Nugroho, Sp.An",  noResep: "RX/2025/05/019" },

  // ── Psikotropika – Midazolam ──────────────────────────
  { id: "rp-001", noUrut: 1,  tanggal: "2025-05-01", jam: "08:40", namaObat: "Midazolam",       kekuatan: "5 mg/mL",   jumlahMasuk: 35, jumlahKeluar: 0, saldo: 35, pengambil: "Apt. Dewi Kusuma, S.Farm", keterangan: "Penerimaan dari gudang farmasi - DO #GF-20250501-004", jenis: "Masuk",  bulan: "2025-05", depo: "Apotek RI",  noRM: undefined, namaPasien: undefined, dokter: undefined, noResep: undefined },
  { id: "rp-002", noUrut: 2,  tanggal: "2025-05-05", jam: "08:45", namaObat: "Midazolam",       kekuatan: "5 mg/mL",   jumlahMasuk: 0,  jumlahKeluar: 2, saldo: 33, pengambil: "Ns. Ahmad Ridwan, S.Kep",  keterangan: "Sedasi ICU",                            jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-007", namaPasien: "Hasan Basri",   dokter: "dr. Hendra Wijaya, Sp.EM", noResep: "RX/2025/05/007" },
  { id: "rp-003", noUrut: 3,  tanggal: "2025-05-06", jam: "22:00", namaObat: "Midazolam",       kekuatan: "5 mg/mL",   jumlahMasuk: 0,  jumlahKeluar: 1, saldo: 32, pengambil: "Ns. Rudi Harmoko, S.Kep",  keterangan: "Agitasi – sesuai RASS target",          jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-007", namaPasien: "Hasan Basri",   dokter: "dr. Hendra Wijaya, Sp.EM", noResep: "RX/2025/05/010" },
  { id: "rp-004", noUrut: 4,  tanggal: "2025-05-12", jam: "09:30", namaObat: "Midazolam",       kekuatan: "5 mg/mL",   jumlahMasuk: 0,  jumlahKeluar: 1, saldo: 31, pengambil: "Ns. Dini Amalia, S.Kep",   keterangan: "Premedikasi prosedur",                  jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-003", namaPasien: "Ahmad Fauzi",   dokter: "dr. Dewi Kusuma, Sp.JP",  noResep: "RX/2025/05/018" },

  // ── Psikotropika – Diazepam ───────────────────────────
  { id: "rp-010", noUrut: 1,  tanggal: "2025-05-01", jam: "08:45", namaObat: "Diazepam",        kekuatan: "5 mg/mL",   jumlahMasuk: 40, jumlahKeluar: 0, saldo: 40, pengambil: "Apt. Dewi Kusuma, S.Farm", keterangan: "Penerimaan dari gudang farmasi - DO #GF-20250501-004", jenis: "Masuk",  bulan: "2025-05", depo: "Apotek RI",  noRM: undefined, namaPasien: undefined, dokter: undefined, noResep: undefined },
  { id: "rp-011", noUrut: 2,  tanggal: "2025-05-04", jam: "14:00", namaObat: "Diazepam",        kekuatan: "5 mg/mL",   jumlahMasuk: 0,  jumlahKeluar: 2, saldo: 38, pengambil: "Ns. Siti Rahayu, S.Kep",  keterangan: "Status epileptikus – loading dose",     jenis: "Keluar", bulan: "2025-05", depo: "Depo IGD",   noRM: "RM-2025-005", namaPasien: "Joko Prasetyo", dokter: "dr. Surya Pratama, Sp.N",   noResep: "RX/2025/05/005" },
  { id: "rp-012", noUrut: 3,  tanggal: "2025-05-08", jam: "20:30", namaObat: "Diazepam",        kekuatan: "5 mg/mL",   jumlahMasuk: 0,  jumlahKeluar: 1, saldo: 37, pengambil: "Ns. Wulan Sari, S.Kep",   keterangan: "Anxiolitik pre-prosedur",               jenis: "Keluar", bulan: "2025-05", depo: "Apotek RI",  noRM: "RM-2025-014", namaPasien: "Ani Setiawati", dokter: "dr. Budi Santoso, Sp.JP",  noResep: "RX/2025/05/014" },
];

// ── Stok opname mock ──────────────────────────────────────

export const STOK_OPNAME_MOCK: StokOpnameEntry[] = [
  { id: "so-001", tanggal: "2025-05-01", namaObat: "Morfin Sulfat",  stokSistem: 50, stokFisik: 50, selisih: 0, petugas: "Apt. Dewi Kusuma, S.Farm",  catatan: "Stok awal bulan, sesuai" },
  { id: "so-002", tanggal: "2025-05-01", namaObat: "Fentanil",        stokSistem: 30, stokFisik: 30, selisih: 0, petugas: "Apt. Dewi Kusuma, S.Farm",  catatan: "Stok awal bulan, sesuai" },
  { id: "so-003", tanggal: "2025-05-01", namaObat: "Midazolam",       stokSistem: 35, stokFisik: 35, selisih: 0, petugas: "Apt. Dewi Kusuma, S.Farm",  catatan: "Stok awal bulan, sesuai" },
  { id: "so-004", tanggal: "2025-05-01", namaObat: "Diazepam",        stokSistem: 40, stokFisik: 40, selisih: 0, petugas: "Apt. Dewi Kusuma, S.Farm",  catatan: "Stok awal bulan, sesuai" },
];

// ── Helpers ───────────────────────────────────────────────

export function getRegisterByDrug(
  nama: string,
  bulan: string,
): RegisterEntry[] {
  return REGISTER_MOCK
    .filter((r) => r.namaObat === nama && r.bulan === bulan)
    .sort((a, b) => a.noUrut - b.noUrut);
}

export function calcCurrentSaldo(nama: string, bulan: string): number {
  const entries = getRegisterByDrug(nama, bulan);
  return entries.length > 0 ? entries[entries.length - 1].saldo : 0;
}

export function getMonthLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-");
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function getAvailableMonths(): string[] {
  const months: string[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}
