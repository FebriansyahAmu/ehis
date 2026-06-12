"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord, type StatusObat,
  STATUS_OBAT_CFG,
} from "@/lib/master/obatMock";
import {
  Field, NumberInput, Select, SectionGroup,
} from "@/components/master/shared";
import { fmtIDR, calcMargin } from "../katalogObatShared";

interface HargaTabProps {
  draft: ObatRecord;
  onPatch: (patch: Partial<ObatRecord>) => void;
}

export default function HargaTab({ draft, onPatch }: HargaTabProps) {
  const margin = calcMargin(draft.hargaSatuan, draft.hpp);
  const exceedsHET = draft.het && draft.hargaSatuan > draft.het;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/* Harga */}
      <SectionGroup
        title="Harga"
        desc="Per satuan terkecil. HPP digunakan untuk hitung margin internal."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Harga Jual" required hint="Per satuan ke pasien">
            <NumberInput
              value={draft.hargaSatuan}
              onChange={(v) => onPatch({ hargaSatuan: v ?? 0 })}
              placeholder="0"
              step={50}
              maxW="max-w-full"
            />
          </Field>
          <Field label="HPP (opsional)" hint="Harga pokok penjualan">
            <NumberInput
              value={draft.hpp}
              onChange={(v) => onPatch({ hpp: v })}
              placeholder="0"
              step={50}
              maxW="max-w-full"
            />
          </Field>
          <Field label="HET BPOM (opsional)" hint="Batas eceran tertinggi">
            <NumberInput
              value={draft.het}
              onChange={(v) => onPatch({ het: v })}
              placeholder="0"
              step={50}
              maxW="max-w-full"
            />
          </Field>
        </div>

        {/* Live preview row */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <PriceCard
            icon={Wallet}
            iconCls="bg-emerald-50 text-emerald-600"
            label="Harga Jual"
            value={fmtIDR(draft.hargaSatuan)}
            sub={draft.satuanTerkecil ? `/ ${draft.satuanTerkecil}` : "/ unit"}
          />
          <PriceCard
            icon={margin !== null && margin > 0 ? TrendingUp : TrendingDown}
            iconCls={
              margin === null
                ? "bg-slate-50 text-slate-500"
                : margin > 30
                  ? "bg-emerald-50 text-emerald-600"
                  : margin > 0
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
            }
            label="Margin"
            value={margin !== null ? `${margin}%` : "—"}
            sub={draft.hpp ? `HPP ${fmtIDR(draft.hpp)}` : "isi HPP utk hitung"}
          />
          <PriceCard
            icon={BadgeCheck}
            iconCls={exceedsHET ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600"}
            label="HET BPOM"
            value={draft.het ? fmtIDR(draft.het) : "—"}
            sub={
              exceedsHET
                ? "Harga jual MELEBIHI HET — review!"
                : draft.het
                  ? "dalam batas"
                  : "opsional"
            }
            warning={!!exceedsHET}
          />
        </div>
      </SectionGroup>

      {/* Status */}
      <SectionGroup
        title="Status Operasional"
        desc="Hanya obat status 'Aktif' yang muncul di pilihan resep."
      >
        <Field label="Status">
          <Select<StatusObat>
            value={draft.status ?? "Aktif"}
            onChange={(v) => v && onPatch({ status: v })}
            options={(Object.keys(STATUS_OBAT_CFG) as StatusObat[]).map((s) => ({
              value: s,
              label: STATUS_OBAT_CFG[s].label,
            }))}
            maxW="max-w-[240px]"
          />
        </Field>
      </SectionGroup>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PriceCard({
  icon: Icon, iconCls, label, value, sub, warning,
}: {
  icon: IconComponent;
  iconCls: string;
  label: string;
  value: string;
  sub: string;
  warning?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border bg-white px-3 py-2",
      warning ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200",
    )}>
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", iconCls)}>
          <Icon size={12} />
        </span>
        <div className="min-w-0">
          <p className="m-mini font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="m-base font-black leading-none text-slate-900 truncate">{value}</p>
        </div>
      </div>
      <p className={cn(
        "mt-1 truncate m-mini",
        warning ? "font-semibold text-rose-700" : "text-slate-500",
      )}>
        {sub}
      </p>
    </div>
  );
}
