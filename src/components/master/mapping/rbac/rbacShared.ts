import { ROLE_CFG, type UserRole } from "@/components/master/pengguna/penggunaShared";

// ── Types ─────────────────────────────────────────────────

export type CrudAction = "read" | "create" | "update" | "delete" | "export";

export interface PermissionLeaf {
  key: string;
  label: string;
  actions: CrudAction[];
}

export interface PermissionModule {
  key: string;
  label: string;
  icon?: string;
  /** Sub-modul / sub-tab leaves */
  leaves: PermissionLeaf[];
}

/**
 * Map[roleId][leafKey] → array of granted actions
 */
export type RBACMap = Record<UserRole, Record<string, CrudAction[]>>;

// ── Permission Tree ──────────────────────────────────────

export const PERMISSION_TREE: PermissionModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    leaves: [
      { key: "dashboard.view",        label: "Dashboard Operasional",        actions: ["read"] },
    ],
  },
  {
    key: "clinical",
    label: "Klinis",
    leaves: [
      { key: "clinical.igd",          label: "IGD",                          actions: ["read", "create", "update", "delete"] },
      { key: "clinical.ri",           label: "Rawat Inap",                   actions: ["read", "create", "update", "delete"] },
      { key: "clinical.rj",           label: "Rawat Jalan",                  actions: ["read", "create", "update", "delete"] },
      { key: "clinical.rekammedis",   label: "Rekam Medis (Asesmen/Anamnesis/Observasi)", actions: ["read", "create", "update", "delete"] },
      { key: "clinical.cppt",         label: "CPPT (SOAP)",                  actions: ["read", "create", "update", "delete"] },
      { key: "clinical.diagnosa",     label: "Diagnosa (ICD-10)",            actions: ["read", "create", "update", "delete"] },
      { key: "clinical.tindakan",     label: "Tindakan / Order",             actions: ["read", "create", "update", "delete"] },
      { key: "clinical.resep",        label: "Resep & Obat",                 actions: ["read", "create", "update", "delete"] },
    ],
  },
  {
    key: "ancillary",
    label: "Penunjang",
    leaves: [
      { key: "ancillary.lab.worklist", label: "Lab — Worklist",              actions: ["read", "update"] },
      { key: "ancillary.lab.validate", label: "Lab — Validasi Hasil",        actions: ["read", "update"] },
      { key: "ancillary.lab.critical", label: "Lab — Critical Value",        actions: ["read", "create"] },
      { key: "ancillary.rad.worklist", label: "Rad — Worklist",              actions: ["read", "update"] },
      { key: "ancillary.rad.expertise", label: "Rad — Ekspertise Laporan",   actions: ["read", "create", "update"] },
      { key: "ancillary.farmasi.telaah", label: "Farmasi — Telaah Resep",    actions: ["read", "update"] },
      { key: "ancillary.farmasi.serah",  label: "Farmasi — Dispensing & Serah", actions: ["read", "update"] },
    ],
  },
  {
    key: "registration",
    label: "Registrasi & Billing",
    leaves: [
      { key: "registration.loket",    label: "Loket Registrasi — Akses Modul", actions: ["read"] },
      { key: "registration.pasien",   label: "Master Pasien",                actions: ["read", "create", "update", "delete"] },
      { key: "registration.kunjungan", label: "Pendaftaran Kunjungan",       actions: ["read", "create", "update", "delete"] },
      { key: "billing.invoice",       label: "Billing — Invoice",            actions: ["read", "create", "update", "delete", "export"] },
      { key: "billing.kasir",         label: "Billing — Kasir / Bayar",      actions: ["read", "create"] },
      { key: "billing.klaim",         label: "Billing — Klaim BPJS",         actions: ["read", "create", "update", "export"] },
    ],
  },
  {
    key: "master",
    label: "Master Data",
    leaves: [
      { key: "master.view",           label: "Master — Akses Modul",         actions: ["read"] },
      { key: "master.ruangan",        label: "Unit & Ruangan",               actions: ["read", "create", "update", "delete"] },
      { key: "master.dokter",         label: "Dokter & Nakes",               actions: ["read", "create", "update", "delete"] },
      { key: "master.pegawai",        label: "Data Pegawai (SDM)",           actions: ["read", "create", "update", "delete"] },
      { key: "master.pengguna",       label: "Pengguna Sistem",              actions: ["read", "create", "update", "delete"] },
      { key: "master.mapping",        label: "Mapping Hub",                  actions: ["read", "update"] },
      { key: "master.penugasan-ruangan", label: "Penugasan SDM ⇄ Ruangan",   actions: ["read", "create", "delete"] },
      { key: "master.katalog",        label: "Katalog (Obat/Lab/ICD)",       actions: ["read", "create", "update", "delete"] },
      { key: "master.icd",            label: "Katalog ICD-10/9",             actions: ["read", "create", "update", "delete"] },
      { key: "master.triase",         label: "Triase IGD (Skala Klinis)",    actions: ["read", "create", "update", "delete"] },
      { key: "master.tarif",          label: "Tarif & Paket",                actions: ["read", "create", "update", "delete"] },
      { key: "master.konfigurasi",    label: "Konfigurasi Sistem (Template/Enum/Profil)", actions: ["read", "update"] },
    ],
  },
  {
    key: "report",
    label: "Laporan & Analytics",
    leaves: [
      { key: "report.clinical",       label: "Laporan Klinis",               actions: ["read", "export"] },
      { key: "report.financial",      label: "Laporan Keuangan",             actions: ["read", "export"] },
      { key: "report.audit",          label: "Audit Trail",                  actions: ["read", "export"] },
    ],
  },
];

// ── Config ───────────────────────────────────────────────

export const ACTION_CFG: Record<
  CrudAction,
  { label: string; short: string; bg: string; text: string; ring: string }
> = {
  read:   { label: "Read",   short: "R", bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200" },
  create: { label: "Create", short: "C", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  update: { label: "Update", short: "U", bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200" },
  delete: { label: "Delete", short: "D", bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  export: { label: "Export", short: "E", bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200" },
};

export const ROLE_ORDER: UserRole[] = [
  "Admin", "Dokter", "Perawat", "Apoteker", "Radiografer", "SpPK", "SpRad", "Kasir", "Registrasi",
];

// ── Helpers ───────────────────────────────────────────────

/**
 * Default permission per role berdasarkan responsibility.
 * - Admin: full access
 * - Dokter: full klinis + farmasi read, lab/rad order + read
 * - Perawat: klinis read+update terbatas, MAR write
 * - Apoteker: farmasi full, klinis read
 * - Lab/Rad: penunjang full, klinis read
 * - Kasir: billing full, klinis read
 * - Registrasi: registrasi full, klinis read
 */
const ROLE_DEFAULT_GRANTS: Record<UserRole, Record<string, CrudAction[]>> = {
  Admin: PERMISSION_TREE.reduce<Record<string, CrudAction[]>>((acc, m) => {
    for (const l of m.leaves) acc[l.key] = [...l.actions];
    return acc;
  }, {}),
  Dokter: {
    "clinical.igd": ["read", "create", "update"],
    "clinical.ri": ["read", "create", "update"],
    "clinical.rj": ["read", "create", "update"],
    "clinical.rekammedis": ["read", "create", "update"], // rekam medis lintas-unit; ABAC careUnit batasi unit
    "clinical.cppt": ["read", "create", "update", "delete"], // delete = hanya catatan miliknya (guard Service)
    "clinical.diagnosa": ["read", "create", "update"],
    "clinical.tindakan": ["read", "create", "update"],
    "clinical.resep": ["read", "create", "update"],
    // CATATAN: TIDAK diberi ancillary.* — itu untuk unit penunjang (Lab/Rad/Farmasi) yang
    // berdiri-sendiri. Dokter lihat status order via tab rekam medis (clinical.*), bukan
    // worklist penunjang. Grant ancillary.* di sini dulu bikin menu penunjang muncul keliru.
    "master.triase": ["read"], // baca protokol triase (decision-support di TriaseTab)
    "report.clinical": ["read", "export"],
    // baca DATA referensi+registrasi utk rekam medis — TANPA master.view/registration.loket (modul tersembunyi)
    "master.ruangan": ["read"], // resolve nama ruangan (board/detail)
    "master.dokter": ["read"], // resolve nama DPJP
    "master.icd": ["read"], // cari kode ICD saat koding diagnosis
    "registration.pasien": ["read"],
    "registration.kunjungan": ["read"],
  },
  Perawat: {
    "clinical.igd": ["read", "update"],
    "clinical.ri": ["read", "update"],
    "clinical.rj": ["read", "update"], // perawat poli/rawat jalan — menu RJ muncul bila unit kerja mencakup RJ
    "clinical.rekammedis": ["read", "update"], // rekam medis lintas-unit; ABAC careUnit batasi unit
    "clinical.cppt": ["read", "create", "delete"], // delete = hanya catatan miliknya (guard Service)
    "clinical.tindakan": ["read", "update"],
    "clinical.resep": ["read"],
    // CATATAN: TIDAK diberi ancillary.* — itu untuk unit penunjang (Lab/Rad/Farmasi) yang
    // berdiri-sendiri. Perawat lihat status order via tab rekam medis, bukan worklist penunjang.
    "master.triase": ["read"], // baca protokol triase (decision-support di TriaseTab)
    // baca DATA referensi+registrasi utk rekam medis — TANPA master.view/registration.loket (modul tersembunyi)
    "master.ruangan": ["read"], // resolve nama ruangan (board/detail)
    "master.dokter": ["read"], // resolve nama DPJP
    "master.icd": ["read"], // cari kode ICD saat koding diagnosis
    "registration.pasien": ["read"],
    "registration.kunjungan": ["read"],
  },
  Apoteker: {
    "clinical.resep": ["read"],
    "ancillary.farmasi.telaah": ["read", "update"],
    "ancillary.farmasi.serah": ["read", "update"],
    "master.view": ["read"], // gate modul Master (kelola katalog)
    "master.katalog": ["read", "update"],
    "report.clinical": ["read"],
  },
  // Penunjang = unit berdiri-sendiri (Lab/Rad/Farmasi): akses MURNI via ancillary.* + halaman
  // worklist sendiri. TIDAK terikat clinical.ri/rj (itu modul rekam medis RI/RJ, beda unit).
  // Konteks klinis order sudah denormal di worklist; tak perlu buka rekam medis kunjungan.
  Radiografer: {
    "ancillary.rad.worklist": ["read", "update"],
  },
  SpPK: {
    "ancillary.lab.worklist": ["read", "update"],
    "ancillary.lab.validate": ["read", "update"],
    "ancillary.lab.critical": ["read", "create"],
    "report.clinical": ["read", "export"],
  },
  SpRad: {
    "ancillary.rad.worklist": ["read", "update"],
    "ancillary.rad.expertise": ["read", "create", "update"],
    "report.clinical": ["read", "export"],
  },
  Kasir: {
    "billing.invoice": ["read", "create", "update"],
    "billing.kasir": ["read", "create"],
    "billing.klaim": ["read", "update"],
    "registration.pasien": ["read"],
    "registration.kunjungan": ["read"],
    "report.financial": ["read", "export"],
  },
  Registrasi: {
    "dashboard.view": ["read"],
    "registration.loket": ["read"], // gate modul loket — eksklusif role registrasi
    "registration.pasien": ["read", "create", "update"],
    "registration.kunjungan": ["read", "create", "update"],
    "clinical.rj": ["read"],
  },
};

export function initRBACMap(): RBACMap {
  return JSON.parse(JSON.stringify(ROLE_DEFAULT_GRANTS));
}

/** Bangun RBACMap dari grant DB (Record<roleKey, kode[]> dgn kode "leaf:action"). */
export function mapFromGrants(grants: Record<string, string[]>): RBACMap {
  const map = {} as RBACMap;
  for (const role of ROLE_ORDER) {
    const rec: Record<string, CrudAction[]> = {};
    for (const kode of grants[role] ?? []) {
      const idx = kode.indexOf(":");
      if (idx < 0) continue;
      const leaf = kode.slice(0, idx);
      const action = kode.slice(idx + 1) as CrudAction;
      (rec[leaf] ??= []).push(action);
    }
    map[role] = rec;
  }
  return map;
}

/** Flatten grant satu role → daftar kode "leaf:action" (untuk PATCH ke server). */
export function grantsForRole(map: RBACMap, role: UserRole): string[] {
  const out: string[] = [];
  for (const [leaf, actions] of Object.entries(map[role] ?? {})) {
    for (const a of actions) out.push(`${leaf}:${a}`);
  }
  return out.sort();
}

export function hasAction(map: RBACMap, role: UserRole, leafKey: string, action: CrudAction): boolean {
  return (map[role]?.[leafKey] ?? []).includes(action);
}

export function toggleAction(
  map: RBACMap,
  role: UserRole,
  leafKey: string,
  action: CrudAction,
): RBACMap {
  const next: RBACMap = { ...map };
  next[role] = { ...(next[role] ?? {}) };
  const current = next[role][leafKey] ?? [];
  next[role][leafKey] = current.includes(action)
    ? current.filter((a) => a !== action)
    : [...current, action];
  return next;
}

export function setLeafAll(
  map: RBACMap,
  role: UserRole,
  leaf: PermissionLeaf,
  grant: boolean,
): RBACMap {
  const next: RBACMap = { ...map };
  next[role] = { ...(next[role] ?? {}) };
  next[role][leaf.key] = grant ? [...leaf.actions] : [];
  return next;
}

export function setModuleAll(
  map: RBACMap,
  role: UserRole,
  module: PermissionModule,
  grant: boolean,
): RBACMap {
  const next: RBACMap = { ...map };
  next[role] = { ...(next[role] ?? {}) };
  for (const l of module.leaves) {
    next[role][l.key] = grant ? [...l.actions] : [];
  }
  return next;
}

export function countLeafGrants(map: RBACMap, role: UserRole, leaf: PermissionLeaf): number {
  return (map[role]?.[leaf.key] ?? []).length;
}

export function countModuleGrants(
  map: RBACMap,
  role: UserRole,
  module: PermissionModule,
): { granted: number; total: number } {
  let granted = 0, total = 0;
  for (const l of module.leaves) {
    granted += (map[role]?.[l.key] ?? []).length;
    total += l.actions.length;
  }
  return { granted, total };
}

export function countTotalGrants(map: RBACMap, role: UserRole): { granted: number; total: number } {
  let granted = 0, total = 0;
  for (const m of PERMISSION_TREE) {
    const c = countModuleGrants(map, role, m);
    granted += c.granted;
    total += c.total;
  }
  return { granted, total };
}

export function getRoleCfg(role: UserRole) {
  return ROLE_CFG[role];
}
