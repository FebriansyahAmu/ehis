"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UNIT_CFG, KELAS_CFG, STATUS_CFG, LIFECYCLE_CFG, fmtRupiah, fmtRupiahShort } from "../tagihanShared";
import {
  formatTanggalShort, formatTanggalFull, sisa, type TagihanRow,
} from "../tagihanBoardLogic";
import type { Density } from "../tagihanShared";
import TagihanRowActions, { type ActionKey } from "./TagihanRowActions";
import RowCheckbox from "./RowCheckbox";

interface Props {
  row: TagihanRow;
  index: number;
  density: Density;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (row: TagihanRow) => void;
  onAction: (action: ActionKey, row: TagihanRow) => void;
}

const PENJAMIN_CFG: Record<TagihanRow["penjamin"]["tipe"], { bg: string; text: string; dot: string }> = {
  umum:     { bg: "bg-slate-100",  text: "text-slate-700",   dot: "bg-slate-500"   },
  bpjs:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  asuransi: { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500"     },
  jamkesda: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
};

const DENSITY_CFG: Record<Density, { padY: string; fontSize: string }> = {
  compact:     { padY: "py-2",   fontSize: "text-[11.5px]" },
  comfortable: { padY: "py-2.5", fontSize: "text-[12.5px]" },
  cozy:        { padY: "py-3.5", fontSize: "text-[13px]"   },
};

export default function TagihanRow({
  row, index, density, selected, onToggleSelect, onOpenDetail, onAction,
}: Props) {
  const sisaVal = sisa(row);
  const unitCfg = UNIT_CFG[row.unit];
  const kelasCfg = KELAS_CFG[row.kelas];
  const statusCfg = STATUS_CFG[row.status];
  const penjaminCfg = PENJAMIN_CFG[row.penjamin.tipe];
  const StatusIcon = statusCfg.icon!;
  const lifeCfg = LIFECYCLE_CFG[row.lifecycle ?? "Draft"];
  const LifeIcon = lifeCfg.icon!;
  const dcfg = DENSITY_CFG[density];

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, delay: Math.min(index * 0.018, 0.3), ease: "easeOut" }}
      onClick={() => onOpenDetail(row)}
      className={cn(
        "group cursor-pointer border-b border-slate-100 transition-colors dark:border-slate-800/60",
        selected
          ? "bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/30 dark:hover:bg-amber-950/40"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40",
      )}
    >
      {/* Checkbox */}
      <td className={cn("pl-3 pr-1", dcfg.padY)} onClick={(e) => e.stopPropagation()}>
        <RowCheckbox
          checked={selected}
          onChange={() => onToggleSelect(row.id)}
          label={`Pilih tagihan ${row.noTagihan}`}
        />
      </td>

      {/* No Tagihan + Tanggal */}
      <td className={cn("px-2", dcfg.padY)}>
        <div className={cn("font-mono font-semibold tracking-tight text-slate-800 dark:text-slate-100", dcfg.fontSize)}>
          {row.noTagihan}
        </div>
        <div
          className="mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400"
          title={formatTanggalFull(row.tanggalISO)}
        >
          {formatTanggalShort(row.tanggalISO)}
        </div>
      </td>

      {/* Pasien */}
      <td className={cn("px-2", dcfg.padY)}>
        <div className={cn("font-medium text-slate-800 dark:text-slate-100", dcfg.fontSize)}>
          {row.pasien.nama}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
          <span className="font-mono">{row.pasien.noRM}</span>
          <span className="text-slate-300">·</span>
          <span>{row.pasien.gender} {row.pasien.age}th</span>
        </div>
      </td>

      {/* Unit · Kelas */}
      <td className={cn("px-2", dcfg.padY)}>
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium ring-1",
              unitCfg.bg, unitCfg.text, unitCfg.ring,
            )}
          >
            <span className={cn("inline-block h-1 w-1 rounded-full", unitCfg.dot)} />
            {unitCfg.label}
          </span>
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:text-slate-300 dark:ring-slate-700"
            title={`Kelas ${kelasCfg.label}`}
          >
            {kelasCfg.short}
          </span>
        </div>
      </td>

      {/* Penjamin */}
      <td className={cn("px-2", dcfg.padY)}>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium",
            penjaminCfg.bg, penjaminCfg.text,
          )}
        >
          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", penjaminCfg.dot)} />
          {row.penjamin.nama}
        </span>
      </td>

      {/* Total */}
      <td className={cn("px-2 text-right tabular-nums", dcfg.padY)}>
        <div className={cn("font-semibold text-slate-800 dark:text-slate-100", dcfg.fontSize)}>
          {fmtRupiahShort(row.total)}
        </div>
        <div className="mt-0.5 text-[10px] text-slate-400" title={fmtRupiah(row.total)}>
          {fmtRupiah(row.total)}
        </div>
      </td>

      {/* Dibayar */}
      <td className={cn("px-2 text-right tabular-nums", dcfg.padY)}>
        <div
          className={cn(
            dcfg.fontSize,
            row.dibayar > 0
              ? "font-medium text-slate-700 dark:text-slate-200"
              : "text-slate-400 dark:text-slate-500",
          )}
        >
          {row.dibayar > 0 ? fmtRupiahShort(row.dibayar) : "—"}
        </div>
      </td>

      {/* Sisa */}
      <td className={cn("px-2 text-right tabular-nums", dcfg.padY)}>
        <div
          className={cn(
            "font-semibold",
            dcfg.fontSize,
            sisaVal === 0
              ? "text-emerald-600 dark:text-emerald-400"
              : sisaVal > 5_000_000
              ? "text-rose-700 dark:text-rose-400"
              : "text-rose-600 dark:text-rose-400",
          )}
        >
          {sisaVal === 0 ? "Lunas" : fmtRupiahShort(sisaVal)}
        </div>
      </td>

      {/* Status */}
      <td className={cn("px-2", dcfg.padY)}>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ring-1",
            statusCfg.bg, statusCfg.text, statusCfg.ring,
          )}
        >
          <StatusIcon size={9} className="opacity-80" />
          {statusCfg.label}
        </span>
      </td>

      {/* Finalisasi (lifecycle) */}
      <td className={cn("px-2 text-center", dcfg.padY)}>
        <span
          title={row.lifecycle === "Final" ? "Tagihan sudah difinalisasi (charge beku)" : "Tagihan masih Draft (charge mengikuti order)"}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ring-1",
            lifeCfg.bg, lifeCfg.text, lifeCfg.ring,
          )}
        >
          <LifeIcon size={9} className="opacity-80" />
          {lifeCfg.label}
        </span>
      </td>

      {/* Aksi */}
      <td className={cn("pl-2 pr-3", dcfg.padY)} onClick={(e) => e.stopPropagation()}>
        <TagihanRowActions row={row} onAction={onAction} />
      </td>
    </motion.tr>
  );
}
