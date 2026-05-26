"use client";

/**
 * KlaimRow — single tr untuk Klaim Table (EK2.2).
 *
 * Cols (11):
 *  1.  ☐ select         (stop-propagation klik)
 *  2.  No Klaim + Tgl   (mono + tanggal subtle)
 *  3.  Pasien (RM)
 *  4.  Unit / Kelas chip
 *  5.  Penjamin badge
 *  6.  Grouper code + group
 *  7.  Tarif RS (right · mono)
 *  8.  Tarif Grouper (right · mono · tone emerald/rose vs Tarif RS)
 *  9.  Selisih (right · chip emerald/rose/neutral)
 *  10. Status chip
 *  11. Kebab ⋮ menu
 *
 * Row interaction:
 * - Click anywhere (except checkbox/kebab) → navigate ke detail
 * - Hover: bg teal-50/30 + ring kiri teal
 * - Selected: bg teal-50/60 + ring kiri teal solid
 */

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  fmtRupiahKpi,
  fmtRupiahFull,
} from "../klaimBoardShared";
import type { KebabActionKey } from "../klaimBoardLogic";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

import ClaimStatusChip from "../shared/ClaimStatusChip";
import PenjaminBadge from "../shared/PenjaminBadge";
import GrouperChip from "../shared/GrouperChip";
import UnitKelasChip from "../shared/UnitKelasChip";
import KlaimRowKebab from "./KlaimRowKebab";
import { ALIGN_CLASS, COLUMN_DEFS, DENSITY_TOKENS } from "./tableTokens";
import type { Density } from "../klaimBoardShared";

interface Props {
  claim: ClaimRecord;
  density: Density;
  selected: boolean;
  index: number;
  onToggleSelect: (id: string) => void;
  onKebabAction: (key: KebabActionKey, claim: ClaimRecord) => void;
}

export default function KlaimRow({
  claim,
  density,
  selected,
  index,
  onToggleSelect,
  onKebabAction,
}: Props) {
  const router = useRouter();
  const tokens = DENSITY_TOKENS[density];

  const tarifGrouper = claim.iDRG?.tarifAktual ?? claim.inaCbgLegacy?.tarif.kelas2 ?? null;
  const selisih = claim.selisih;
  const isOver = selisih !== undefined && selisih > 0n;
  const isUnder = selisih !== undefined && selisih < 0n;
  const dateLabel = formatDateShort(claim.createdAt);

  const handleRowClick = () => {
    router.push(`/ehis-eklaim/klaim/${claim.id}`);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.18) }}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
      tabIndex={0}
      role="row"
      aria-selected={selected}
      className={cn(
        "group cursor-pointer border-b border-slate-100 transition-colors",
        selected
          ? "bg-teal-50/60 hover:bg-teal-50/80"
          : "bg-white hover:bg-teal-50/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40",
      )}
    >
      {/* 1. Select */}
      <Cell tokens={tokens} align="center" colKey="select">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(claim.id);
          }}
          className="inline-flex h-full w-full items-center justify-center"
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(claim.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Pilih klaim ${claim.noKlaim}`}
            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
      </Cell>

      {/* 2. No Klaim + Tanggal */}
      <Cell tokens={tokens} align="left" colKey="noKlaim">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p
            className={cn("truncate font-mono font-semibold text-slate-800", tokens.fontMono)}
            title={claim.noKlaim}
          >
            {claim.noKlaim}
          </p>
          <p className={cn("text-slate-500 tabular-nums", tokens.fontHint)}>{dateLabel}</p>
        </div>
      </Cell>

      {/* 3. Pasien */}
      <Cell tokens={tokens} align="left" colKey="pasien">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p
            className={cn("truncate font-semibold text-slate-800", tokens.fontBody)}
            title={claim.pasienId}
          >
            {claim.pasienId}
          </p>
          <p className={cn("text-slate-500", tokens.fontHint)}>
            {claim.age}th · {claim.gender === "L" ? "♂" : "♀"} · LOS {claim.los}h
          </p>
        </div>
      </Cell>

      {/* 4. Unit/Kelas */}
      <Cell tokens={tokens} align="left" colKey="unitKelas">
        <UnitKelasChip unit={claim.tipePelayanan} kelas={claim.kelas} />
      </Cell>

      {/* 5. Penjamin */}
      <Cell tokens={tokens} align="left" colKey="penjamin">
        <PenjaminBadge penjamin={claim.penjamin} />
      </Cell>

      {/* 6. Grouper */}
      <Cell tokens={tokens} align="left" colKey="grouper">
        <GrouperChip claim={claim} />
      </Cell>

      {/* 7. Tarif RS */}
      <Cell tokens={tokens} align="right" colKey="tarifRS">
        <p
          className={cn("font-mono font-semibold tabular-nums text-slate-800", tokens.fontMono)}
          title={fmtRupiahFull(claim.tarifRS)}
        >
          {fmtRupiahKpi(claim.tarifRS)}
        </p>
      </Cell>

      {/* 8. Tarif Grouper */}
      <Cell tokens={tokens} align="right" colKey="tarifGrouper">
        {tarifGrouper !== null ? (
          <p
            className={cn(
              "font-mono font-semibold tabular-nums",
              tokens.fontMono,
              isOver
                ? "text-emerald-700"
                : isUnder
                  ? "text-rose-700"
                  : "text-slate-700",
            )}
            title={fmtRupiahFull(tarifGrouper)}
          >
            {fmtRupiahKpi(tarifGrouper)}
          </p>
        ) : (
          <span className={cn("text-slate-400", tokens.fontMono)}>—</span>
        )}
      </Cell>

      {/* 9. Selisih */}
      <Cell tokens={tokens} align="right" colKey="selisih">
        <SelisihChip selisih={selisih} fontClass={tokens.fontMono} />
      </Cell>

      {/* 10. Status */}
      <Cell tokens={tokens} align="left" colKey="status">
        <ClaimStatusChip status={claim.statusPenjamin} size="xs" />
      </Cell>

      {/* 11. Kebab */}
      <Cell tokens={tokens} align="center" colKey="actions">
        <KlaimRowKebab claim={claim} onAction={onKebabAction} />
      </Cell>
    </motion.tr>
  );
}

// ── Cell wrapper ───────────────────────────────────────

function Cell({
  tokens,
  align,
  colKey,
  children,
}: {
  tokens: ReturnType<typeof getTokens>;
  align: "left" | "right" | "center";
  colKey: string;
  children: React.ReactNode;
}) {
  const col = COLUMN_DEFS.find((c) => c.key === colKey);
  if (!col) return null;
  return (
    <td
      className={cn(
        "whitespace-nowrap align-middle",
        tokens.rowPy,
        tokens.rowPx,
        ALIGN_CLASS[align],
        col.hideOnSmall && "hidden lg:table-cell",
      )}
      style={{ width: col.width, maxWidth: col.width }}
    >
      <div className={cn("min-w-0", align === "right" ? "flex justify-end" : "")}>
        {children}
      </div>
    </td>
  );
}

function getTokens(density: Density) {
  return DENSITY_TOKENS[density];
}

// ── Selisih Chip ───────────────────────────────────────

function SelisihChip({
  selisih,
  fontClass,
}: {
  selisih: bigint | undefined;
  fontClass: string;
}) {
  if (selisih === undefined) {
    return <span className={cn("text-slate-400", fontClass)}>—</span>;
  }
  if (selisih === 0n) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-slate-500", fontClass)}>
        <Minus size={11} />
        <span className="font-mono tabular-nums">0</span>
      </span>
    );
  }
  const isPositive = selisih > 0n;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono font-semibold tabular-nums ring-1",
        fontClass,
        isPositive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-rose-200",
      )}
      title={fmtRupiahFull(selisih)}
    >
      <Icon size={10} strokeWidth={2.4} />
      {isPositive ? "+" : ""}
      {fmtRupiahKpi(selisih)}
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" });
}
