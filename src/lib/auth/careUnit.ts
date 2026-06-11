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

/** Boleh akses konteks unit kunjungan? Bypass = bebas; selain itu harus termasuk unit kerjanya. */
export function canAccessUnit(
  actor: { isSuperuser: boolean; isGlobal: boolean; careUnits: string[] },
  unit: string,
): boolean {
  return unitScopeBypassed(actor) || actor.careUnits.includes(unit);
}
