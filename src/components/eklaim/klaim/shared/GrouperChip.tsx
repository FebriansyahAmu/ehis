"use client";

/**
 * GrouperChip — display kode grouper (iDRG 7-digit numerik atau INA-CBG 4-digit alphanumeric).
 *
 * - era "iDRG"           → teal chip (primary post-Okt 2025)
 * - era "INA_CBG_Legacy" → slate chip + "L" superscript (active secondary)
 * - no result            → `—` placeholder
 */

import { cn } from "@/lib/utils";
import { KLAIM_TONE } from "../klaimBoardShared";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

interface Props {
  claim: ClaimRecord;
  /** Tampilkan group label di bawah kode. */
  withGroup?: boolean;
  className?: string;
}

export default function GrouperChip({ claim, withGroup = true, className }: Props) {
  const isIDRG = claim.eraGrouper === "iDRG";
  const tone = KLAIM_TONE[isIDRG ? "teal" : "slate"];
  const code = claim.iDRG?.code ?? claim.inaCbgLegacy?.code ?? null;
  const group = claim.iDRG?.group ?? claim.inaCbgLegacy?.group ?? null;

  if (!code) {
    return <span className={cn("font-mono text-[12px] text-slate-400", className)}>—</span>;
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[12px] font-bold ring-1 tabular-nums",
            tone.chipBg,
            tone.chipText,
            tone.chipRing,
          )}
        >
          {code}
        </span>
        {!isIDRG && (
          <span
            className="rounded-sm bg-slate-200 px-1 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-600"
            title="Legacy INA-CBG (klaim pre-Okt 2025)"
          >
            L
          </span>
        )}
      </div>
      {withGroup && group && (
        <p className="truncate text-[11px] text-slate-500" title={group}>
          {group}
        </p>
      )}
    </div>
  );
}
