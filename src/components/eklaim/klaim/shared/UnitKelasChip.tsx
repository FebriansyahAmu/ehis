"use client";

/**
 * UnitKelasChip — mini chip combo: Unit + Kelas.
 *
 * Display compact:
 *   [Unit-short] · [Kelas-short]
 *
 * Pakai dot separator untuk save horizontal space di table cell.
 */

import { cn } from "@/lib/utils";
import { KLAIM_TONE, UNIT_CFG, KELAS_CFG } from "../klaimBoardShared";
import type { TipePelayanan, KelasRawat } from "@/lib/eklaim/eklaimShared";

interface Props {
  unit: TipePelayanan;
  kelas: KelasRawat;
  className?: string;
}

export default function UnitKelasChip({ unit, kelas, className }: Props) {
  const unitCfg = UNIT_CFG[unit];
  const kelasCfg = KELAS_CFG[kelas];
  const unitTone = KLAIM_TONE[unitCfg.tone];
  const kelasTone = KLAIM_TONE[kelasCfg.tone];

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1",
          unitTone.chipBg,
          unitTone.chipText,
          unitTone.chipRing,
        )}
        title={unitCfg.label}
      >
        {unitCfg.short}
      </span>
      <span
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1",
          kelasTone.chipBg,
          kelasTone.chipText,
          kelasTone.chipRing,
        )}
        title={kelasCfg.label}
      >
        {kelasCfg.short}
      </span>
    </div>
  );
}
