"use client";

/**
 * ClaimStatusChip — chip badge untuk `ClaimStatus` (13 status variants).
 *
 * Variants:
 * - size: "xs" (8.5px icon · for dense table) | "sm" (11px icon · default chip)
 * - withDot: dot indicator vs icon (subtle vs explicit)
 */

import { cn } from "@/lib/utils";
import { KLAIM_TONE, STATUS_CFG } from "../klaimBoardShared";
import type { ClaimStatus } from "@/lib/eklaim/eklaimShared";

interface Props {
  status: ClaimStatus;
  size?: "xs" | "sm";
  withDot?: boolean;
  className?: string;
}

export default function ClaimStatusChip({
  status,
  size = "sm",
  withDot = false,
  className,
}: Props) {
  const cfg = STATUS_CFG[status];
  const tone = KLAIM_TONE[cfg.tone];
  const Icon = cfg.icon!;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-semibold ring-1",
        size === "xs" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-[12px]",
        tone.chipBg,
        tone.chipText,
        tone.chipRing,
        className,
      )}
    >
      {withDot ? (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
      ) : (
        <Icon size={size === "xs" ? 10 : 11} strokeWidth={2.4} />
      )}
      <span className="truncate">{cfg.label}</span>
    </span>
  );
}
