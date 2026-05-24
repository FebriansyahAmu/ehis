/**
 * Indonesian number-to-words helper untuk tampilan & cetak struk.
 * Spec: "satu", "sepuluh", "seratus", "seribu", "sejuta", "semilyar", "setriliun".
 * Output diakhiri "rupiah" (sentence-case).
 *
 * Contoh:
 *   terbilang(1234) → "Seribu dua ratus tiga puluh empat rupiah"
 *   terbilang(0)    → "Nol rupiah"
 *   terbilang(-500) → "Minus lima ratus rupiah"
 */

const SATUAN = [
  "", "satu", "dua", "tiga", "empat", "lima",
  "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas",
];

const SKALA = ["", "ribu", "juta", "milyar", "triliun"];

function chunk(n: number): string {
  // 0..999
  if (n === 0) return "";
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r === 0 ? `${SATUAN[t]} puluh` : `${SATUAN[t]} puluh ${SATUAN[r]}`;
  }
  if (n < 200) {
    const r = n - 100;
    return r === 0 ? "seratus" : `seratus ${chunk(r)}`;
  }
  // 200..999
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;
  const base = `${SATUAN[ratus]} ratus`;
  return sisa === 0 ? base : `${base} ${chunk(sisa)}`;
}

function joinScales(n: number): string {
  if (n === 0) return "nol";
  const parts: string[] = [];
  let scale = 0;
  let rest = n;
  while (rest > 0) {
    const c = rest % 1000;
    if (c > 0) {
      let segment: string;
      if (scale === 1 && c === 1) {
        segment = "seribu"; // special: "seribu" not "satu ribu"
      } else {
        const s = SKALA[scale];
        segment = s ? `${chunk(c)} ${s}` : chunk(c);
      }
      parts.unshift(segment);
    }
    rest = Math.floor(rest / 1000);
    scale += 1;
  }
  return parts.join(" ");
}

/** Indonesian terbilang (number to words) + suffix "rupiah", sentence-case. */
export function terbilang(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const isNeg = n < 0;
  const abs = Math.floor(Math.abs(n));
  const words = joinScales(abs);
  const cap = words.charAt(0).toUpperCase() + words.slice(1);
  return `${isNeg ? "Minus " : ""}${cap} rupiah`;
}
