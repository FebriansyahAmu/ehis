// Helper tanggal & periode bersama modul BPJS (SEP, Rujukan, …). Tanggal V-Claim = "yyyy-mm-dd"
// tanpa zona → dibaca sebagai tanggal LOKAL tengah malam (bukan `new Date(iso)` yang UTC dan bisa
// mundur sehari), dan "hari ini" dihitung lokal (bukan toISOString).

/** "yyyy-mm-dd" (atau ISO) → Date LOKAL tengah malam; tanggal-saja tidak digeser zona. */
export function parseTgl(s: string | null | undefined): Date | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "yyyy-mm-dd" lokal. */
export function keISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Hari ini sebagai yyyy-mm-dd LOKAL (bukan toISOString yang UTC → bisa mundur sehari). */
export function hariIniISO(): string {
  return keISO(new Date());
}

/** Tanggal panjang, mis. "01 Mei 2026". */
export function fmtTgl(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseTgl(iso);
  if (!d) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

/** Tanggal ringkas, mis. "1 Mei 2026". */
export function fmtTglPendek(iso: string | null | undefined): string {
  const d = parseTgl(iso);
  return d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

/** Instan (audit) → tanggal + jam zona lokal browser. */
export function fmtWaktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Selisih hari kalender `dari` → `sampai` (yyyy-mm-dd); null bila salah satu tak valid. */
export function selisihHari(dari: string | null | undefined, sampai: string | null | undefined): number | null {
  const a = parseTgl(dari);
  const b = parseTgl(sampai);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Selisih hari kalender dari hari ini (lokal) ke tanggal `iso`; null bila tak valid. */
export function sisaHari(iso: string | null | undefined): number | null {
  return selisihHari(hariIniISO(), iso);
}

/** Geser tanggal yyyy-mm-dd sebanyak `n` hari (kalender lokal). */
export function geserHari(iso: string, n: number): string {
  const d = parseTgl(iso) ?? new Date();
  return keISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

// ── Periode bulanan ───────────────────────────────────────

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export interface Periode {
  bulan: number; // 1–12
  tahun: number;
}

export function periodeIni(): Periode {
  const d = new Date();
  return { bulan: d.getMonth() + 1, tahun: d.getFullYear() };
}

export function geserPeriode(p: Periode, langkah: number): Periode {
  const d = new Date(p.tahun, p.bulan - 1 + langkah, 1);
  return { bulan: d.getMonth() + 1, tahun: d.getFullYear() };
}

export function samaPeriode(a: Periode, b: Periode): boolean {
  return a.bulan === b.bulan && a.tahun === b.tahun;
}

export function labelPeriode(p: Periode): string {
  return `${NAMA_BULAN[p.bulan - 1]} ${p.tahun}`;
}

/** Hari pertama & terakhir periode sebagai yyyy-mm-dd. */
export function rentangPeriode(p: Periode): { mulai: string; akhir: string } {
  return { mulai: keISO(new Date(p.tahun, p.bulan - 1, 1)), akhir: keISO(new Date(p.tahun, p.bulan, 0)) };
}
