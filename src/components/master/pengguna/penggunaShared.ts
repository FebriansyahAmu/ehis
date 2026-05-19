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
  username: string;
  nama: string;
  email: string;
  telp?: string;
  role: UserRole;
  unitAssignment: string[]; // kode unit/poli
  status: UserStatus;
  lastLogin: string | null; // ISO
  createdAt: string;        // ISO
  /** Link ke Practitioner master jika role klinis */
  dokterId?: string;
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

// ── Mock Data ─────────────────────────────────────────────

export const PENGGUNA_MOCK: PenggunaRecord[] = [
  {
    id: "user-001",
    username: "admin.it",
    nama: "Andi Suryanto",
    email: "andi.suryanto@rsharapansehat.id",
    telp: "0812-1111-1111",
    role: "Admin",
    unitAssignment: ["ADMIN"],
    status: "Aktif",
    lastLogin: "2026-05-19T08:30:00Z",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "user-002",
    username: "budi.santoso",
    nama: "dr. Budi Santoso, Sp.JP",
    email: "budi.santoso@rsharapansehat.id",
    telp: "0812-3456-7890",
    role: "Dokter",
    unitAssignment: ["RI", "ICU"],
    status: "Aktif",
    lastLogin: "2026-05-19T07:45:00Z",
    createdAt: "2024-02-01T00:00:00Z",
    dokterId: "dr-001",
  },
  {
    id: "user-003",
    username: "siti.maryani",
    nama: "Siti Maryani, S.Kep",
    email: "siti.maryani@rsharapansehat.id",
    telp: "0813-2222-3333",
    role: "Perawat",
    unitAssignment: ["RI"],
    status: "Aktif",
    lastLogin: "2026-05-19T06:00:00Z",
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "user-004",
    username: "ahmad.fauzi",
    nama: "Ahmad Fauzi, S.Farm., Apt",
    email: "ahmad.fauzi@rsharapansehat.id",
    telp: "0814-3333-4444",
    role: "Apoteker",
    unitAssignment: ["FARMASI"],
    status: "Aktif",
    lastLogin: "2026-05-18T16:20:00Z",
    createdAt: "2024-03-15T00:00:00Z",
  },
  {
    id: "user-005",
    username: "rina.wati",
    nama: "Rina Wati, S.Tr.Rad",
    email: "rina.wati@rsharapansehat.id",
    telp: "0815-4444-5555",
    role: "Radiografer",
    unitAssignment: ["RAD"],
    status: "Aktif",
    lastLogin: "2026-05-19T09:10:00Z",
    createdAt: "2024-04-01T00:00:00Z",
  },
  {
    id: "user-006",
    username: "dewi.kasir",
    nama: "Dewi Lestari",
    email: "dewi.lestari@rsharapansehat.id",
    role: "Kasir",
    unitAssignment: ["KASIR"],
    status: "Aktif",
    lastLogin: "2026-05-19T07:30:00Z",
    createdAt: "2024-05-12T00:00:00Z",
  },
  {
    id: "user-007",
    username: "joko.regist",
    nama: "Joko Pramono",
    email: "joko.pramono@rsharapansehat.id",
    role: "Registrasi",
    unitAssignment: ["REGIST"],
    status: "Suspended",
    lastLogin: "2026-04-30T12:00:00Z",
    createdAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "user-008",
    username: "hendra.sppk",
    nama: "dr. Hendra Wijaya, Sp.PK",
    email: "hendra.sppk@rsharapansehat.id",
    role: "SpPK",
    unitAssignment: ["LAB"],
    status: "Aktif",
    lastLogin: "2026-05-19T08:00:00Z",
    createdAt: "2024-02-20T00:00:00Z",
  },
  {
    id: "user-009",
    username: "putri.sprad",
    nama: "dr. Putri Anggraini, Sp.Rad",
    email: "putri.sprad@rsharapansehat.id",
    role: "SpRad",
    unitAssignment: ["RAD"],
    status: "Aktif",
    lastLogin: "2026-05-19T07:50:00Z",
    createdAt: "2024-02-25T00:00:00Z",
  },
  {
    id: "user-010",
    username: "rangga.lama",
    nama: "Rangga Mahendra",
    email: "rangga.lama@rsharapansehat.id",
    role: "Perawat",
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
