// Zona waktu RS — satu sumber untuk mengubah jam dinding dari form menjadi instan nyata.
//
// Konvensi (mulai 2026-11-21, TECH_DEBT "Zona waktu input jam"):
//   - Kolom timestamptz menyimpan INSTAN NYATA. Jangan lagi menempelkan `Z` ke jam dinding form.
//   - Teks tanpa offset dari klien ("YYYY-MM-DD", "YYYY-MM-DDTHH:mm[:ss]", kontrak DateTimePicker /
//     TimePicker) = jam dinding LOKAL RS → dikonversi dengan `RS_TIMEZONE` (IANA, mis. Asia/Jakarta ·
//     Asia/Makassar · Asia/Jayapura). Teks ber-offset / `Z` dipakai apa adanya.
//   - Turunan yang bergantung jam lokal (shift jaga, batas hari, hari rawat) memakai `rsParts`/`rsDayKey`,
//     bukan getter UTC.
// Indonesia tanpa DST → offset tetap; konversi tetap memakai 2 lintasan agar benar untuk zona ber-DST.

const DEFAULT_TZ = "Asia/Jakarta";
let cached: string | null = null;

/** Zona waktu RS dari env `RS_TIMEZONE`; tak di-set / tak dikenal → Asia/Jakarta (+ peringatan sekali). */
export function rsTimeZone(): string {
  if (cached) return cached;
  const raw = process.env.RS_TIMEZONE?.trim();
  let tz = DEFAULT_TZ;
  if (raw) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: raw });
      tz = raw;
    } catch {
      console.warn(`[rsTime] RS_TIMEZONE "${raw}" tidak dikenal — pakai ${DEFAULT_TZ}`);
    }
  } else if (process.env.NODE_ENV !== "test") {
    console.warn(`[rsTime] RS_TIMEZONE tidak di-set — jam form dianggap ${DEFAULT_TZ}`);
  }
  cached = tz;
  return tz;
}

export interface RsParts { year: number; month: number; day: number; hour: number; minute: number; second: number }

/** Kalender + jam sebuah instan menurut zona RS (bulan 1–12). */
export function rsParts(d: Date, tz: string = rsTimeZone()): RsParts {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(d);
  const n = (t: Intl.DateTimeFormatPartTypes) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { year: n("year"), month: n("month"), day: n("day"), hour: n("hour"), minute: n("minute"), second: n("second") };
}

/** "YYYY-MM-DD" sebuah instan menurut zona RS. */
export function rsDayKey(d: Date, tz: string = rsTimeZone()): string {
  const p = rsParts(d, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function offsetMs(at: number, tz: string): number {
  const p = rsParts(new Date(at), tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(at / 1000) * 1000;
}

const HAS_TZ = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;
const NAIVE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;

/**
 * Teks waktu dari klien → instan. Ber-offset/`Z` → apa adanya. Tanpa offset = jam dinding RS.
 * Mengembalikan null bila format/komponen tak valid (mis. bulan 13, jam 25).
 */
export function parseClientDateTime(raw: string, tz: string = rsTimeZone()): Date | null {
  const s = raw.trim();
  if (HAS_TZ.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = NAIVE.exec(s);
  if (!m) return null;
  const [y, mo, da, h, mi, se, ms] = [m[1], m[2], m[3], m[4] ?? "0", m[5] ?? "0", m[6] ?? "0", (m[7] ?? "0").padEnd(3, "0")].map(Number);
  const wall = Date.UTC(y, mo - 1, da, h, mi, se, ms);
  const w = new Date(wall);
  if (w.getUTCFullYear() !== y || w.getUTCMonth() !== mo - 1 || w.getUTCDate() !== da || w.getUTCHours() !== h || w.getUTCMinutes() !== mi) {
    return null;
  }
  const first = wall - offsetMs(wall, tz);
  return new Date(wall - offsetMs(first, tz));
}

/** Awal hari 00:00 RS untuk tanggal "YYYY-MM-DD" (null bila tak valid). */
export function rsStartOfDay(date: string, tz: string = rsTimeZone()): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseClientDateTime(`${date}T00:00`, tz) : null;
}

/** Akhir hari RS (23:59:59.999) untuk tanggal "YYYY-MM-DD" — batas inklusif filter periode. */
export function rsEndOfDay(date: string, tz: string = rsTimeZone()): Date | null {
  const start = rsStartOfDay(date, tz);
  if (!start) return null;
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const nextStart = rsStartOfDay(next.toISOString().slice(0, 10), tz);
  return nextStart ? new Date(nextStart.getTime() - 1) : null;
}

/** Selisih hari kalender RS antara dua instan (b − a), mis. untuk hari rawat. */
export function rsDayDiff(a: Date, b: Date, tz: string = rsTimeZone()): number {
  const k = (d: Date) => { const p = rsParts(d, tz); return Date.UTC(p.year, p.month - 1, p.day); };
  return Math.round((k(b) - k(a)) / 86_400_000);
}
