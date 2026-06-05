// ── Types ─────────────────────────────────────────────────

export type UserRole =
  | "Admin"
  | "Dokter"
  | "Perawat"
  | "Apoteker"
  | "Radiografer"
  | "SpPK"      // Sp Patologi Klinik (validator lab)
  | "SpRad"     // Sp Radiologi (validator radiologi)
  | "Kasir"
  | "Registrasi";

export type UserStatus = "Aktif" | "Suspended" | "Non_Aktif";

export interface UserUnit {
  kode: string;
  nama: string;
}

export interface PenggunaRecord {
  id: string;
  /** Akun WAJIB tertaut 1 pegawai (master.Pegawai) — identitas = sumber tunggal Pegawai. */
  pegawaiId: string;
  username: string;
  /** Snapshot identitas dari Pegawai (display only — source of truth = Pegawai). */
  nama: string;
  email: string;
  telp?: string;
  /** Multi-role (auth.User M:N) — permission efektif = UNION lintas role. */
  roles: UserRole[];
  unitAssignment: string[]; // kode unit/poli
  status: UserStatus;
  /** Paksa ganti password saat login pertama (provisioning). */
  mustChangePassword?: boolean;
  lastLogin: string | null; // ISO
  createdAt: string;        // ISO
  /** Link ke Practitioner master jika role klinis */
  dokterId?: string;
}

// ── Pegawai (master.Pegawai, bentuk ringkas utk picker akun) ─────────────────

export type StatusPegawai = "ASN" | "Outsourcing" | "Honorer" | "Magang" | "Mitra";

export interface PegawaiLite {
  id: string;
  nip: string;
  gelarDepan?: string;
  namaLengkap: string;
  gelarBelakang?: string;
  email: string;
  unitKerja: string;
  statusPegawai: StatusPegawai;
  isDokter: boolean;
  /** Sudah punya akun login? → cegah provisioning ganda (zero orphan / no-dup). */
  punyaAkun: boolean;
}

/** Nama tampil tergabung gelar (dr. Budi Santoso, Sp.JP). */
export function namaTampilPegawai(
  p: Pick<PegawaiLite, "gelarDepan" | "namaLengkap" | "gelarBelakang">,
): string {
  const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
  const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
  return `${depan}${p.namaLengkap}${belakang}`;
}

// ── Form data (wizard Tambah Pengguna: Pegawai → Akun → Role) ────────────────
// Field selaras schema master.Pegawai (Zod CreatePegawaiInput). Tiap step = 1 "POST".

export interface PegawaiFormData {
  nik: string;
  nip: string;
  gelarDepan?: string;
  namaLengkap: string;
  gelarBelakang?: string;
  jenisKelamin: "L" | "P";
  agama?: string;
  tempatLahir?: string;
  tanggalLahir?: string; // yyyy-mm-dd
  statusPegawai: StatusPegawai;
  unitKerja?: string;
  tglMasuk?: string; // yyyy-mm-dd
  alamat?: string;
  noHp?: string;
  email?: string;
  /** Jenis tenaga (Dokter/Perawat/…) — sumber kebenaran profesi. */
  profesi?: string;
  /** Pegawai klinis (practitioner) — DITURUNKAN dari profesi dokter; set dokterId saat akun dibuat. */
  isDokter: boolean;
  kontakDarurat?: { nama: string; hubungan: string; noHp: string };
}

export interface AkunData {
  username: string;
  password: string;
  mustChangePassword: boolean;
}

/** Pegawai yang SUDAH ada (belum punya akun) → "Buatkan Akun": wizard mulai dari Step 2. */
export interface ExistingPegawaiSeed {
  id: string;
  namaLengkap: string;
  namaTampil: string;
  nip: string;
  email: string | null;
  unitKerja: string | null;
  statusPegawai: string;
  isDokter: boolean;
}

export function newPegawaiId(): string {
  return `peg-${Math.random().toString(36).slice(2, 8)}`;
}

/** PegawaiFormData → PegawaiLite (ditambah ke daftar pegawai setelah "POST" pegawai). */
export function pegawaiFormToLite(id: string, d: PegawaiFormData): PegawaiLite {
  return {
    id,
    nip: d.nip,
    gelarDepan: d.gelarDepan,
    namaLengkap: d.namaLengkap,
    gelarBelakang: d.gelarBelakang,
    email: d.email ?? "",
    unitKerja: d.unitKerja || "—",
    statusPegawai: d.statusPegawai,
    isDokter: d.isDokter,
    punyaAkun: true,
  };
}

// ── Config ───────────────────────────────────────────────

export const ROLE_CFG: Record<
  UserRole,
  { label: string; desc: string; bg: string; text: string }
> = {
  Admin:       { label: "Admin",        desc: "Akses penuh sistem",         bg: "bg-rose-50",     text: "text-rose-700" },
  Dokter:      { label: "Dokter",       desc: "DPJP / dokter umum",         bg: "bg-teal-50",     text: "text-teal-700" },
  Perawat:     { label: "Perawat",      desc: "Asuhan keperawatan",         bg: "bg-emerald-50",  text: "text-emerald-700" },
  Apoteker:    { label: "Apoteker",     desc: "Pelayanan farmasi",          bg: "bg-violet-50",   text: "text-violet-700" },
  Radiografer: { label: "Radiografer",  desc: "Akuisisi gambar radiologi",  bg: "bg-amber-50",    text: "text-amber-700" },
  SpPK:        { label: "Sp. Patologi", desc: "Validator hasil lab",        bg: "bg-sky-50",      text: "text-sky-700" },
  SpRad:       { label: "Sp. Radiologi",desc: "Pembaca expertise rad",      bg: "bg-pink-50",     text: "text-pink-700" },
  Kasir:       { label: "Kasir",        desc: "Billing & pembayaran",       bg: "bg-yellow-50",   text: "text-yellow-700" },
  Registrasi:  { label: "Registrasi",   desc: "Pendaftaran pasien",         bg: "bg-cyan-50",     text: "text-cyan-700" },
};

export const STATUS_CFG: Record<
  UserStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  Aktif:     { label: "Aktif",      bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Suspended: { label: "Suspended",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  Non_Aktif: { label: "Non-Aktif",  bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400" },
};

export const UNIT_LIST: UserUnit[] = [
  { kode: "IGD",        nama: "IGD" },
  { kode: "RJ",         nama: "Rawat Jalan" },
  { kode: "RI",         nama: "Rawat Inap" },
  { kode: "ICU",        nama: "ICU" },
  { kode: "FARMASI",    nama: "Farmasi" },
  { kode: "LAB",        nama: "Laboratorium" },
  { kode: "RAD",        nama: "Radiologi" },
  { kode: "KASIR",      nama: "Kasir" },
  { kode: "REGIST",     nama: "Registrasi" },
  { kode: "ADMIN",      nama: "Sistem" },
];

// ── Opsi form pegawai (dipakai wizard Tambah + form Ubah Data Pegawai) ───────

export const STATUS_PEGAWAI_OPTS: StatusPegawai[] = ["ASN", "Outsourcing", "Honorer", "Magang", "Mitra"];

// Agama besar dunia + "Lainnya" di akhir (master.Pegawai.agama = String?).
export const AGAMA_OPTS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Yahudi", "Lainnya"];

// Jenis tenaga (acuan SISDMK). Profesi = sumber kebenaran "Dokter / Perawat / dst.".
export const PROFESI_OPTS = [
  "Dokter", "Dokter Gigi", "Dokter Spesialis", "Perawat", "Bidan",
  "Apoteker", "Tenaga Teknis Kefarmasian", "Ahli Teknologi Lab Medik",
  "Radiografer", "Nutrisionis", "Fisioterapis", "Tenaga Kesehatan Lainnya",
  "Administrator", "Non-Tenaga Kesehatan",
];

// Profesi yang = dokter → turunkan isDokter (tautan master Dokter / Practitioner FHIR).
const DOCTOR_PROFESI = new Set(["Dokter", "Dokter Gigi", "Dokter Spesialis"]);
export const isDoctorProfesi = (p?: string): boolean => !!p && DOCTOR_PROFESI.has(p);

// Opsi Unit Kerja (dropdown) — selaras daftar unit sistem.
export const UNIT_KERJA_OPTS = UNIT_LIST.map((u) => u.nama);

// ── Mock Data ─────────────────────────────────────────────

// Pegawai (master) — sumber identitas akun. peg-011/012 BELUM punya akun (kandidat
// provisioning di modal Tambah Pengguna).
export const PEGAWAI_MOCK: PegawaiLite[] = [
  { id: "peg-001", nip: "199001012015011001", namaLengkap: "Andi Suryanto", email: "andi.suryanto@rsharapansehat.id", unitKerja: "Sistem / IT", statusPegawai: "ASN", isDokter: false, punyaAkun: true },
  { id: "peg-002", nip: "198203122010121002", gelarDepan: "dr.", namaLengkap: "Budi Santoso", gelarBelakang: "Sp.JP", email: "budi.santoso@rsharapansehat.id", unitKerja: "Rawat Inap", statusPegawai: "ASN", isDokter: true, punyaAkun: true },
  { id: "peg-003", nip: "199205152018032003", namaLengkap: "Siti Maryani", gelarBelakang: "S.Kep", email: "siti.maryani@rsharapansehat.id", unitKerja: "Rawat Inap", statusPegawai: "ASN", isDokter: false, punyaAkun: true },
  { id: "peg-004", nip: "199107202017011004", namaLengkap: "Ahmad Fauzi", gelarBelakang: "S.Farm., Apt", email: "ahmad.fauzi@rsharapansehat.id", unitKerja: "Farmasi", statusPegawai: "Outsourcing", isDokter: false, punyaAkun: true },
  { id: "peg-005", nip: "199403102019032005", namaLengkap: "Rina Wati", gelarBelakang: "S.Tr.Rad", email: "rina.wati@rsharapansehat.id", unitKerja: "Radiologi", statusPegawai: "Outsourcing", isDokter: false, punyaAkun: true },
  { id: "peg-006", nip: "199506182020012006", namaLengkap: "Dewi Lestari", email: "dewi.lestari@rsharapansehat.id", unitKerja: "Kasir", statusPegawai: "Outsourcing", isDokter: false, punyaAkun: true },
  { id: "peg-007", nip: "199311052016011007", namaLengkap: "Joko Pramono", email: "joko.pramono@rsharapansehat.id", unitKerja: "Registrasi", statusPegawai: "Honorer", isDokter: false, punyaAkun: true },
  { id: "peg-008", nip: "198008252009121008", gelarDepan: "dr.", namaLengkap: "Hendra Wijaya", gelarBelakang: "Sp.PK", email: "hendra.sppk@rsharapansehat.id", unitKerja: "Laboratorium", statusPegawai: "ASN", isDokter: true, punyaAkun: true },
  { id: "peg-009", nip: "198106152010122009", gelarDepan: "dr.", namaLengkap: "Putri Anggraini", gelarBelakang: "Sp.Rad", email: "putri.sprad@rsharapansehat.id", unitKerja: "Radiologi", statusPegawai: "ASN", isDokter: true, punyaAkun: true },
  { id: "peg-010", nip: "199001202014011010", namaLengkap: "Rangga Mahendra", email: "rangga.lama@rsharapansehat.id", unitKerja: "IGD", statusPegawai: "Honorer", isDokter: false, punyaAkun: true },
  { id: "peg-011", nip: "199709142022032011", namaLengkap: "Maya Sari", gelarBelakang: "A.Md.Keb", email: "maya.sari@rsharapansehat.id", unitKerja: "Rawat Inap", statusPegawai: "Outsourcing", isDokter: false, punyaAkun: false },
  { id: "peg-012", nip: "198902112013121012", gelarDepan: "dr.", namaLengkap: "Toni Hardianto", email: "toni.hardianto@rsharapansehat.id", unitKerja: "IGD", statusPegawai: "ASN", isDokter: true, punyaAkun: false },
];

export const PENGGUNA_MOCK: PenggunaRecord[] = [
  {
    id: "user-001",
    pegawaiId: "peg-001",
    username: "admin.it",
    nama: "Andi Suryanto",
    email: "andi.suryanto@rsharapansehat.id",
    telp: "0812-1111-1111",
    roles: ["Admin"],
    unitAssignment: ["ADMIN"],
    status: "Aktif",
    lastLogin: "2026-05-19T08:30:00Z",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "user-002",
    pegawaiId: "peg-002",
    username: "budi.santoso",
    nama: "dr. Budi Santoso, Sp.JP",
    email: "budi.santoso@rsharapansehat.id",
    telp: "0812-3456-7890",
    roles: ["Dokter"],
    unitAssignment: ["RI", "ICU"],
    status: "Aktif",
    lastLogin: "2026-05-19T07:45:00Z",
    createdAt: "2024-02-01T00:00:00Z",
    dokterId: "dr-001",
  },
  {
    id: "user-003",
    pegawaiId: "peg-003",
    username: "siti.maryani",
    nama: "Siti Maryani, S.Kep",
    email: "siti.maryani@rsharapansehat.id",
    telp: "0813-2222-3333",
    roles: ["Perawat"],
    unitAssignment: ["RI"],
    status: "Aktif",
    lastLogin: "2026-05-19T06:00:00Z",
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "user-004",
    pegawaiId: "peg-004",
    username: "ahmad.fauzi",
    nama: "Ahmad Fauzi, S.Farm., Apt",
    email: "ahmad.fauzi@rsharapansehat.id",
    telp: "0814-3333-4444",
    roles: ["Apoteker"],
    unitAssignment: ["FARMASI"],
    status: "Aktif",
    lastLogin: "2026-05-18T16:20:00Z",
    createdAt: "2024-03-15T00:00:00Z",
  },
  {
    id: "user-005",
    pegawaiId: "peg-005",
    username: "rina.wati",
    nama: "Rina Wati, S.Tr.Rad",
    email: "rina.wati@rsharapansehat.id",
    telp: "0815-4444-5555",
    roles: ["Radiografer"],
    unitAssignment: ["RAD"],
    status: "Aktif",
    lastLogin: "2026-05-19T09:10:00Z",
    createdAt: "2024-04-01T00:00:00Z",
  },
  {
    id: "user-006",
    pegawaiId: "peg-006",
    username: "dewi.kasir",
    nama: "Dewi Lestari",
    email: "dewi.lestari@rsharapansehat.id",
    roles: ["Kasir"],
    unitAssignment: ["KASIR"],
    status: "Aktif",
    lastLogin: "2026-05-19T07:30:00Z",
    createdAt: "2024-05-12T00:00:00Z",
  },
  {
    id: "user-007",
    pegawaiId: "peg-007",
    username: "joko.regist",
    nama: "Joko Pramono",
    email: "joko.pramono@rsharapansehat.id",
    roles: ["Registrasi"],
    unitAssignment: ["REGIST"],
    status: "Suspended",
    lastLogin: "2026-04-30T12:00:00Z",
    createdAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "user-008",
    pegawaiId: "peg-008",
    username: "hendra.sppk",
    nama: "dr. Hendra Wijaya, Sp.PK",
    email: "hendra.sppk@rsharapansehat.id",
    // Multi-role: validator lab + tetap DPJP klinis.
    roles: ["SpPK", "Dokter"],
    unitAssignment: ["LAB"],
    status: "Aktif",
    lastLogin: "2026-05-19T08:00:00Z",
    createdAt: "2024-02-20T00:00:00Z",
    dokterId: "dr-008",
  },
  {
    id: "user-009",
    pegawaiId: "peg-009",
    username: "putri.sprad",
    nama: "dr. Putri Anggraini, Sp.Rad",
    email: "putri.sprad@rsharapansehat.id",
    roles: ["SpRad", "Dokter"],
    unitAssignment: ["RAD"],
    status: "Aktif",
    lastLogin: "2026-05-19T07:50:00Z",
    createdAt: "2024-02-25T00:00:00Z",
    dokterId: "dr-009",
  },
  {
    id: "user-010",
    pegawaiId: "peg-010",
    username: "rangga.lama",
    nama: "Rangga Mahendra",
    email: "rangga.lama@rsharapansehat.id",
    roles: ["Perawat"],
    unitAssignment: ["IGD"],
    status: "Non_Aktif",
    lastLogin: "2025-12-15T14:00:00Z",
    createdAt: "2024-01-20T00:00:00Z",
  },
];

// ── Helpers ───────────────────────────────────────────────

export function newUserId(): string {
  return `user-${Math.random().toString(36).slice(2, 8)}`;
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtRelative(iso?: string | null): string {
  if (!iso) return "Belum pernah";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  return fmtDate(iso);
}

export function getUnitNama(kode: string): string {
  return UNIT_LIST.find((u) => u.kode === kode)?.nama ?? kode;
}
