// Care-unit scope (ABAC) — turunkan unit kerja (Pegawai.unitKerja, string bebas, boleh multi)
// menjadi konteks layanan {IGD, RawatJalan, RawatInap} = nilai Kunjungan.unit. Dipakai untuk
// membatasi modul care + worklist + akses rekam medis ke unit kerja user (kecuali superuser/global).

export type CareUnit = "IGD" | "RawatJalan" | "RawatInap";

// Urutan: cek IGD dulu (paling spesifik), lalu inap (banyak alias), lalu jalan/poli.
const RULES: { re: RegExp; unit: CareUnit }[] = [
  { re: /\b(igd|ugd)\b|gawat\s*darurat|emergen/i, unit: "IGD" },
  { re: /rawat\s*inap|ranap|bangsal|\bicu\b|\bhcu\b|\bnicu\b|\bpicu\b|isolasi|perinatologi|kebidanan|bersalin/i, unit: "RawatInap" },
  { re: /rawat\s*jalan|rajal|\bpoli|klinik/i, unit: "RawatJalan" },
];

/** Pegawai.unitKerja (boleh multi, dipisah koma) → daftar CareUnit unik. */
export function careUnitsFromUnitKerja(unitKerja: string | null | undefined): CareUnit[] {
  if (!unitKerja) return [];
  const out = new Set<CareUnit>();
  for (const tok of unitKerja.split(",")) {
    const s = tok.trim();
    if (!s) continue;
    for (const { re, unit } of RULES) if (re.test(s)) out.add(unit);
  }
  return [...out];
}

/** Bypass care-unit scope: superuser (Admin) atau role global (tak diikat unit, mis. Registrasi). */
export function unitScopeBypassed(actor: { isSuperuser: boolean; isGlobal: boolean }): boolean {
  return actor.isSuperuser || actor.isGlobal;
}

/** Aktor penunjang (Lab/Rad/Farmasi) — punya izin `ancillary.*`. Penunjang = layanan LINTAS-UNIT
 *  (melayani IGD/RI/RJ) → tak diikat careUnit untuk rekam medis yang memang lintas-unit (mis. CPPT
 *  terintegrasi, rekonsiliasi obat, baca resep). Selaras keputusan "penunjang standalone, TIDAK
 *  kena careUnit ABAC". RBAC (assertCan, jalan SEBELUM ABAC) tetap membatasi resource yang boleh
 *  disentuh — bypass ini hanya melonggarkan unit-scope, bukan memberi izin baru. */
export function isAncillaryActor(actor: { permissions: Set<string> }): boolean {
  for (const p of actor.permissions) if (p.startsWith("ancillary.")) return true;
  return false;
}

/** Boleh akses konteks unit kunjungan? Bypass = bebas; selain itu harus termasuk unit kerjanya. */
export function canAccessUnit(
  actor: { isSuperuser: boolean; isGlobal: boolean; careUnits: string[]; permissions: Set<string> },
  unit: string,
): boolean {
  return unitScopeBypassed(actor) || isAncillaryActor(actor) || actor.careUnits.includes(unit);
}
