// Barcode TTE — representasi visual serial tanda tangan elektronik pada resep. Pola bar
// deterministik dari `value` (stabil per-token, tampil otentik). Bukan Code128 ter-decode penuh;
// cukup untuk dokumen/print (mock always-success). Render SVG → tajam saat dicetak.

interface Props {
  value: string;
  /** tinggi bar (px). */
  height?: number;
  /** lebar 1 modul (px). */
  unit?: number;
  className?: string;
  /** tampilkan serial di bawah barcode. */
  showValue?: boolean;
}

// Modul = lebar bar/space (1..4 unit), berseling bar(hitam)/space(putih), diapit guard.
function buildModules(value: string): number[] {
  const mods: number[] = [2, 1, 1, 1]; // guard kiri
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    mods.push((c & 3) + 1, ((c >> 2) & 3) + 1, ((c >> 4) & 3) + 1, ((c >> 6) & 3) + 1);
  }
  mods.push(1, 1, 1, 2); // guard kanan
  return mods;
}

export default function TteBarcode({ value, height = 52, unit = 2, className, showValue = true }: Props) {
  const safe = value || "TTE-000000";
  const mods = buildModules(safe);
  const width = mods.reduce((s, m) => s + m, 0) * unit;

  let x = 0;
  const bars: { x: number; w: number }[] = [];
  mods.forEach((m, i) => {
    const w = m * unit;
    if (i % 2 === 0) bars.push({ x, w }); // index genap = bar hitam
    x += w;
  });

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`Barcode tanda tangan elektronik ${safe}`}
        className="block h-auto w-full max-w-[280px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#0f172a" />
        ))}
      </svg>
      {showValue && (
        <p className="mt-1 text-center font-mono text-[10px] font-semibold tracking-[0.18em] text-slate-700">
          {safe}
        </p>
      )}
    </div>
  );
}
