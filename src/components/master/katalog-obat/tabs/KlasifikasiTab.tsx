"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord, type GolonganObat,
  OBAT_MOCK, GOLONGAN_CFG,
} from "@/lib/master/obatMock";
import {
  Field, Select, ToggleSwitch, SectionGroup,
  MappingSourceBadge,
} from "@/components/master/shared";

interface KlasifikasiTabProps {
  draft: ObatRecord;
  onPatch: (patch: Partial<ObatRecord>) => void;
}

export default function KlasifikasiTab({ draft, onPatch }: KlasifikasiTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/* Status Formularium & Safety Flags */}
      <SectionGroup
        title="Status Formularium & Safety"
        desc="Flag-flag yang men-trigger workflow khusus di farmasi (HAM double-check, LASA warning, dst)."
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* Formularium row — full width sehingga banner mapping source ikut flush di bawahnya */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <ToggleSwitch
              value={draft.isFormularium}
              onChange={(v) => onPatch({ isFormularium: v })}
              label="Formularium RS"
              desc="Termasuk formularium nasional / RS. Non-form perlu justifikasi."
              accent="emerald"
            />
            <MappingSourceBadge
              subpage="formularium"
              variant="banner"
              title="Default global — coverage final dikelola di Mapping Hub"
              description="Flag ini hanya seed default per obat. Apakah obat tertanggung untuk tiap penjamin × kelas (BPJS · Asuransi · Umum) di-set di Mapping Hub → Formularium."
              ctaLabel="Atur Coverage"
            />
          </div>
          <ToggleSwitch
            value={draft.isHAM}
            onChange={(v) => onPatch({ isHAM: v })}
            label="HAM (High-Alert Medication)"
            desc="Wajib double-check 2 petugas. Banner warning di resep."
            accent="rose"
          />
          <ToggleSwitch
            value={draft.isLASA ?? false}
            onChange={(v) => onPatch({ isLASA: v, lasaPairIds: v ? draft.lasaPairIds : undefined })}
            label="LASA (Look-Alike Sound-Alike)"
            desc="Mirip dengan obat lain. Atur pasangan di bawah."
            accent="amber"
          />
          <ToggleSwitch
            value={draft.isColdChain ?? false}
            onChange={(v) => onPatch({ isColdChain: v })}
            label="Cold Chain (2-8°C)"
            desc="Butuh penyimpanan rantai dingin."
            accent="sky"
          />
          <ToggleSwitch
            value={draft.isRestricted ?? false}
            onChange={(v) => onPatch({ isRestricted: v })}
            label="Restricted"
            desc="Perlu approval DPJP / SpFK sebelum dispense."
            accent="violet"
          />
        </div>
      </SectionGroup>

      {/* LASA Pair Selector */}
      {draft.isLASA && (
        <SectionGroup
          title="Pasangan LASA"
          desc="Pilih obat-obat yang look-alike / sound-alike dengan obat ini. Saat di-resep, akan muncul warning konfirmasi."
        >
          <LASAPairSelector
            currentId={draft.id}
            selectedIds={draft.lasaPairIds ?? []}
            onChange={(ids) => onPatch({ lasaPairIds: ids })}
          />
        </SectionGroup>
      )}

      {/* Golongan Obat */}
      <SectionGroup
        title="Golongan Legal"
        desc="Klasifikasi menurut UU 35/2009 + PMK 3/2015. Narkotika/Psikotropika WAJIB tercatat di register."
      >
        <Field
          label="Golongan Obat"
          hint="Narkotika/Psikotropika otomatis trigger register N/P."
        >
          <Select<GolonganObat>
            value={draft.golongan}
            onChange={(v) => onPatch({ golongan: v })}
            options={(Object.keys(GOLONGAN_CFG) as GolonganObat[]).map((g) => ({
              value: g,
              label: `${GOLONGAN_CFG[g].short} — ${GOLONGAN_CFG[g].label}`,
            }))}
            placeholder="— pilih golongan —"
            maxW="max-w-[360px]"
          />
        </Field>
        {draft.golongan && <GolonganBanner gol={draft.golongan} />}
      </SectionGroup>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────

function GolonganBanner({ gol }: { gol: GolonganObat }) {
  const cfg = GOLONGAN_CFG[gol];
  const isControlled = cfg.severity === 3;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-2 flex items-start gap-2 rounded-lg border px-3 py-2",
        isControlled ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50",
      )}
    >
      <AlertTriangle size={12} className={isControlled ? "mt-0.5 text-rose-600" : "mt-0.5 text-slate-500"} />
      <div>
        <p className={cn("m-xs font-semibold", isControlled ? "text-rose-800" : "text-slate-700")}>
          {cfg.label}
        </p>
        <p className={cn("mt-0.5 m-mini leading-relaxed", isControlled ? "text-rose-700" : "text-slate-500")}>
          {isControlled
            ? "Wajib tercatat di Register Narkotika/Psikotropika. Pengeluaran butuh approval & double-witness. Stok dihitung harian."
            : cfg.severity === 2
              ? "Termasuk obat resep yang diawasi BPOM. Catat di register harian."
              : cfg.severity === 1
                ? "Obat resep (HARUS resep dokter). Standar dispensing reguler."
                : "Boleh dijual bebas. Tidak perlu resep untuk swamedikasi."}
        </p>
      </div>
    </motion.div>
  );
}

function LASAPairSelector({
  currentId, selectedIds, onChange,
}: {
  currentId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");

  const candidates = useMemo(() => {
    const others = OBAT_MOCK.filter((o) => o.id !== currentId);
    if (!search.trim()) return others.slice(0, 6);
    const q = search.toLowerCase();
    return others.filter((o) =>
      o.namaGenerik.toLowerCase().includes(q) ||
      o.namaDagang.toLowerCase().includes(q),
    ).slice(0, 12);
  }, [search, currentId]);

  const selected = OBAT_MOCK.filter((o) => selectedIds.includes(o.id));

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 m-mini font-semibold text-amber-800"
            >
              <span className="font-mono opacity-70">{o.kode}</span>
              <span>{o.namaGenerik}</span>
              <button
                type="button"
                onClick={() => toggle(o.id)}
                className="ml-1 rounded text-amber-700 hover:bg-amber-200"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-[420px]">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari obat untuk pasangkan sebagai LASA..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* Candidates */}
      <div className="flex flex-wrap gap-1">
        {candidates.map((o) => {
          const isSelected = selectedIds.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 m-mini transition",
                isSelected
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/40",
              )}
            >
              <span className="font-mono opacity-60">{o.kode}</span>
              <span className="font-semibold">{o.namaGenerik}</span>
            </button>
          );
        })}
        {candidates.length === 0 && (
          <p className="m-mini text-slate-400 italic">Tidak ada hasil pencarian.</p>
        )}
      </div>
    </div>
  );
}
