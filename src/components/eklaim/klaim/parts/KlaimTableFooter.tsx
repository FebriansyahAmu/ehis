"use client";

/**
 * KlaimTableFooter — footer summary di bawah tabel.
 *
 * Layout: count rows · density label · total Tarif RS · total Tarif Grouper · total Selisih.
 * Total Selisih dengan tone emerald (positif) / rose (negatif) / slate (zero).
 */

import { cn } from "@/lib/utils";
import {
  fmtRupiahKpi,
  fmtRupiahFull,
  type Density,
} from "../klaimBoardShared";
import { addRupiah } from "@/lib/eklaim/money";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

interface Props {
  rows: ReadonlyArray<ClaimRecord>;
  density: Density;
}

const DENSITY_LABEL: Record<Density, string> = {
  compact: "Compact",
  comfortable: "Comfortable",
  cozy: "Cozy",
};

export default function KlaimTableFooter({ rows, density }: Props) {
  const totalTarifRS = addRupiah(...rows.map((r) => r.tarifRS));
  const totalTarifGrouper = addRupiah(
    ...rows.map((r) => r.iDRG?.tarifAktual ?? r.inaCbgLegacy?.tarif.kelas2 ?? 0n),
  );
  const totalSelisih = addRupiah(...rows.map((r) => r.selisih ?? 0n));

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-800">{rows.length}</span>{" "}
          {rows.length === 1 ? "klaim" : "klaim"}
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-slate-500">density</span>{" "}
          <span className="font-medium text-slate-700">{DENSITY_LABEL[density]}</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
          <SummaryItem
            label="Tarif RS"
            value={fmtRupiahKpi(totalTarifRS)}
            title={fmtRupiahFull(totalTarifRS)}
          />
          <SummaryItem
            label="Tarif Grouper"
            value={fmtRupiahKpi(totalTarifGrouper)}
            title={fmtRupiahFull(totalTarifGrouper)}
            tone="teal"
          />
          <SummaryItem
            label="Selisih"
            value={`${totalSelisih > 0n ? "+" : ""}${fmtRupiahKpi(totalSelisih)}`}
            title={fmtRupiahFull(totalSelisih)}
            tone={totalSelisih > 0n ? "emerald" : totalSelisih < 0n ? "rose" : "slate"}
          />
        </div>
      </div>
    </footer>
  );
}

function SummaryItem({
  label,
  value,
  title,
  tone = "slate",
}: {
  label: string;
  value: string;
  title?: string;
  tone?: "slate" | "teal" | "emerald" | "rose";
}) {
  const valueClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "rose"
        ? "text-rose-700"
        : tone === "teal"
          ? "text-teal-700"
          : "text-slate-800";

  return (
    <span className="inline-flex items-baseline gap-1.5" title={title}>
      <span className="font-sans text-[11.5px] text-slate-500">{label}</span>
      <span className={cn("font-mono font-bold tabular-nums", valueClass)}>{value}</span>
    </span>
  );
}
