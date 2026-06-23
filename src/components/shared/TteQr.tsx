// QR TTE — representasi visual tanda tangan elektronik (validator) pada dokumen hasil (Lab/Rad).
// Matriks QR-style deterministik dari `value` (finder 3-sudut + timing + alignment + data),
// SELARAS pola TteBarcode resep (mock always-success, bukan QR ter-decode penuh). Render SVG
// (shape-rendering crispEdges) → tajam saat dicetak. Untuk QR ter-scan butuh lib encoder (ditunda).
// Generic lintas-modul → prefix serial dapat di-override (TTE-LAB / TTE-RAD / …).

interface Props {
  value: string;
  /** sisi (px). */
  size?: number;
  className?: string;
}

/** FNV-1a hash → seed deterministik. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG mulberry32 (deterministik per-seed). */
function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Serial TTE deterministik (mis. "TTE-LAB-1A2B3C" / "TTE-RAD-…"). */
export function tteSerial(seed: string, prefix = "TTE-LAB"): string {
  const h = fnv1a(seed).toString(36).toUpperCase();
  return `${prefix}-${h.padStart(6, "0").slice(0, 8)}`;
}

const N = 25; // ~QR v2

function buildMatrix(value: string): boolean[][] {
  const m = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
  const res = Array.from({ length: N }, () => Array<boolean>(N).fill(false));

  // Finder 7×7 + separator (1 modul terang di sekeliling).
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        res[rr][cc] = true;
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        if (!inside) { m[rr][cc] = false; continue; }
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[rr][cc] = border || center;
      }
    }
  };
  finder(0, 0);
  finder(0, N - 7);
  finder(N - 7, 0);

  // Timing patterns (baris/kolom 6).
  for (let i = 0; i < N; i++) {
    if (!res[6][i]) { res[6][i] = true; m[6][i] = i % 2 === 0; }
    if (!res[i][6]) { res[i][6] = true; m[i][6] = i % 2 === 0; }
  }

  // Alignment 5×5 (kanan-bawah) — autentisitas visual.
  const align = (r0: number, c0: number) => {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        res[rr][cc] = true;
        m[rr][cc] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      }
    }
  };
  align(N - 7, N - 7);

  // Data deterministik.
  const rnd = mulberry32(fnv1a(value || "TTE"));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!res[r][c]) m[r][c] = rnd() > 0.5;
    }
  }
  return m;
}

export default function TteQr({ value, size = 92, className }: Props) {
  const m = buildMatrix(value || "TTE");
  const q = 2; // quiet zone
  const total = N + q * 2;

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (m[r][c]) {
        rects.push(<rect key={`${r}-${c}`} x={c + q} y={r + q} width={1} height={1} fill="#0f172a" />);
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      role="img"
      aria-label={`QR tanda tangan elektronik ${value}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x={0} y={0} width={total} height={total} fill="#ffffff" />
      {rects}
    </svg>
  );
}
