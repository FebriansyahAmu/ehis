"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers3, Plus, Trash2, Stethoscope, BedDouble, Siren,
  FlaskConical, Radiation, Pill, Zap, Truck, BookOpen, Search,
  ShieldCheck, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PenjaminRecord, PenjaminKelas, PenjaminCoverage } from "@/lib/master/penjaminStore";
import {
  BPJS_RUANGAN_CATALOG, KATEGORI_RUANGAN_CFG, KATEGORI_ORDER,
  type KategoriRuanganBPJS, type BPJSRuanganItem,
} from "@/lib/master/bpjsRuanganCatalog";
import { Field, TextInput, SectionGroup, CheckRow } from "./FormPrimitives";
import { countCoverage } from "../penjaminShared";

interface Props {
  draft: PenjaminRecord;
  onPatch: (p: Partial<PenjaminRecord>) => void;
}

const COVERAGE_ITEMS: {
  key: keyof PenjaminCoverage;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  { key: "rawatInap",    label: "Rawat Inap",    desc: "Bangsal, ICU, HCU, isolasi", icon: BedDouble    },
  { key: "rawatJalan",   label: "Rawat Jalan",   desc: "Poliklinik & one-day-care",  icon: Stethoscope  },
  { key: "igd",          label: "Gawat Darurat", desc: "Triage, observasi, resusitasi", icon: Siren     },
  { key: "laboratorium", label: "Laboratorium",  desc: "Hematologi, kimia, mikro",   icon: FlaskConical },
  { key: "radiologi",    label: "Radiologi",     desc: "X-Ray, USG, CT, MRI",        icon: Radiation    },
  { key: "farmasi",      label: "Farmasi",       desc: "Obat racikan & paten",       icon: Pill         },
  { key: "tindakan",     label: "Tindakan Medis", desc: "Bedah minor & mayor",       icon: Zap          },
  { key: "ambulans",     label: "Ambulans",      desc: "Transport medis",            icon: Truck        },
];

export default function KelasCoveragePane({ draft, onPatch }: Props) {
  const covered = countCoverage(draft.coverage);
  const isBPJS  = draft.tipe === "BPJS";

  const [showCatalog,    setShowCatalog]    = useState(false);
  const [catalogKategori, setCatalogKategori] = useState<KategoriRuanganBPJS | "all">("all");
  const [catalogSearch,  setCatalogSearch]  = useState("");

  // ── Kelas handlers ──
  const addKelas = () => {
    const newKelas: PenjaminKelas = {
      id: `pjk-${Date.now()}`,
      kode: "",
      nama: "",
    };
    onPatch({ kelas: [...draft.kelas, newKelas] });
  };

  const updateKelas = (id: string, p: Partial<PenjaminKelas>) => {
    onPatch({ kelas: draft.kelas.map((k) => (k.id === id ? { ...k, ...p } : k)) });
  };

  const removeKelas = (id: string) => {
    onPatch({ kelas: draft.kelas.filter((k) => k.id !== id) });
  };

  const addFromCatalog = (item: BPJSRuanganItem) => {
    const existing = draft.kelas.find((k) => k.kode === item.kode);
    if (existing) return;
    onPatch({
      kelas: [
        ...draft.kelas,
        {
          id: `pjk-${Date.now()}-${item.kode}`,
          kode: item.kode,
          nama: item.nama,
          deskripsi: item.deskripsi,
          kategori: item.kategori,
        },
      ],
    });
  };

  // ── Coverage handler ──
  const patchCoverage = (key: keyof PenjaminCoverage, value: boolean) =>
    onPatch({ coverage: { ...draft.coverage, [key]: value } });

  // ── Catalog filtered list ──
  const usedKodes = new Set(draft.kelas.map((k) => k.kode));
  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return BPJS_RUANGAN_CATALOG.filter((c) => {
      if (catalogKategori !== "all" && c.kategori !== catalogKategori) return false;
      if (!q) return true;
      return c.kode.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q);
    });
  }, [catalogKategori, catalogSearch]);

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">

        {/* ── Kode Ruangan / SMF ───────────────────────────── */}
        <SectionGroup
          title={isBPJS ? "Kode Ruangan / SMF BPJS" : "Kode Ruangan / Tier Penjamin"}
          icon={Layers3}
          accent={{ bg: "bg-violet-50", text: "text-violet-600" }}
          action={
            <div className="flex items-center gap-1.5">
              {isBPJS && (
                <button
                  onClick={() => setShowCatalog((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition",
                    showCatalog
                      ? "bg-emerald-600 text-white"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                  )}
                >
                  <BookOpen size={10} />
                  Katalog BPJS
                  <ChevronDown size={10} className={cn("transition", showCatalog && "rotate-180")} />
                </button>
              )}
              <button
                onClick={addKelas}
                className="flex items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-violet-700"
              >
                <Plus size={10} /> Manual
              </button>
            </div>
          }
        >
          {/* Catalog picker (collapsible) */}
          <AnimatePresence>
            {showCatalog && isBPJS && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="mb-3 overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50/40"
              >
                <CatalogPicker
                  kategori={catalogKategori}
                  setKategori={setCatalogKategori}
                  search={catalogSearch}
                  setSearch={setCatalogSearch}
                  items={filteredCatalog}
                  usedKodes={usedKodes}
                  onAdd={addFromCatalog}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Kelas list */}
          {draft.kelas.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-6 text-center">
              <Layers3 size={18} className="text-slate-400" />
              <p className="text-[11px] font-semibold text-slate-600">
                Belum ada {isBPJS ? "kode SMF/Ruangan" : "tier penjamin"}
              </p>
              <p className="max-w-65 text-[10px] text-slate-500">
                {isBPJS
                  ? "Klik Katalog BPJS untuk pilih kode SMF/Poli standar (INT/ANA/BED/IGD/dst), atau tambah manual."
                  : "Tambah tier produk penjamin (mis. Bronze/Silver/Gold)."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-90 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {draft.kelas.map((k, i) => (
                  <motion.div
                    key={k.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.15) }}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5"
                  >
                    <div className="grid grid-cols-[80px_1fr_auto] gap-2">
                      <TextInput
                        value={k.kode}
                        onChange={(v) => updateKelas(k.id, { kode: v.toUpperCase() })}
                        placeholder="INT"
                        maxLength={6}
                        mono
                      />
                      <TextInput
                        value={k.nama}
                        onChange={(v) => updateKelas(k.id, { nama: v })}
                        placeholder={isBPJS ? "Nama poli/ruangan (mis. Penyakit Dalam)" : "Nama tier"}
                      />
                      <button
                        onClick={() => removeKelas(k.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {k.kategori && KATEGORI_RUANGAN_CFG[k.kategori as KategoriRuanganBPJS] && (
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          KATEGORI_RUANGAN_CFG[k.kategori as KategoriRuanganBPJS].bg,
                          KATEGORI_RUANGAN_CFG[k.kategori as KategoriRuanganBPJS].text,
                        )}>
                          {KATEGORI_RUANGAN_CFG[k.kategori as KategoriRuanganBPJS].label}
                        </span>
                      )}
                      <input
                        type="text"
                        value={k.deskripsi ?? ""}
                        onChange={(e) => updateKelas(k.id, { deskripsi: e.target.value || undefined })}
                        placeholder="Deskripsi (opsional)"
                        className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {draft.kelas.length > 0 && (
            <div className="mt-3 rounded-lg bg-violet-50/70 px-2.5 py-2 text-[10px] text-violet-700 ring-1 ring-violet-100">
              <span className="font-semibold">Tip:</span> kode ini akan muncul di tab
              <span className="mx-1 rounded bg-white px-1 py-0.5 font-mono text-[9px] font-bold">Mapping Ruangan</span>
              untuk dipetakan ke ruangan rumah sakit.
            </div>
          )}
        </SectionGroup>

        {/* ── Coverage ───────────────────────────────────────── */}
        <SectionGroup
          title="Cakupan Layanan"
          icon={Stethoscope}
          accent={{ bg: "bg-emerald-50", text: "text-emerald-600" }}
          action={
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {covered}/{COVERAGE_ITEMS.length}
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            {COVERAGE_ITEMS.map((c) => (
              <CheckRow
                key={c.key}
                checked={draft.coverage[c.key] as boolean}
                onChange={(v) => patchCoverage(c.key, v)}
                label={c.label}
                icon={c.icon}
                accent="emerald"
              />
            ))}
          </div>

          <div className="mt-3">
            <Field label="Catatan Coverage" hint="opsional">
              <textarea
                value={draft.coverage.catatan ?? ""}
                onChange={(e) => onPatch({ coverage: { ...draft.coverage, catatan: e.target.value || undefined } })}
                placeholder="Mis. khusus formularium nasional / hanya untuk pemegang kartu sehat."
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>
          </div>
        </SectionGroup>
      </div>
    </div>
  );
}

// ── CatalogPicker ────────────────────────────────────────

function CatalogPicker({
  kategori, setKategori, search, setSearch, items, usedKodes, onAdd,
}: {
  kategori: KategoriRuanganBPJS | "all";
  setKategori: (k: KategoriRuanganBPJS | "all") => void;
  search: string;
  setSearch: (s: string) => void;
  items: BPJSRuanganItem[];
  usedKodes: Set<string>;
  onAdd: (item: BPJSRuanganItem) => void;
}) {
  return (
    <div className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck size={12} className="text-emerald-600" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
          Katalog Kode Ruangan BPJS V-Claim
        </p>
        <span className="ml-auto text-[9px] text-emerald-700/70">
          Standar SMF/Poli BPJS Kesehatan
        </span>
      </div>

      {/* Search + kategori filter */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <div className="relative flex-1 min-w-45">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode / nama..."
            className="w-full rounded-md border border-emerald-200 bg-white py-1.5 pl-7 pr-3 text-[11px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
          />
        </div>
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value as KategoriRuanganBPJS | "all")}
          className="rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 outline-none focus:border-emerald-400"
        >
          <option value="all">Semua kategori</option>
          {KATEGORI_ORDER.map((k) => (
            <option key={k} value={k}>{KATEGORI_RUANGAN_CFG[k].label}</option>
          ))}
        </select>
      </div>

      {/* Grid result */}
      {items.length === 0 ? (
        <p className="py-4 text-center text-[10px] text-slate-400">Tidak ada hasil</p>
      ) : (
        <div className="grid max-h-50 grid-cols-2 gap-1.5 overflow-y-auto pr-1 lg:grid-cols-3">
          {items.map((c) => {
            const used = usedKodes.has(c.kode);
            const cfg = KATEGORI_RUANGAN_CFG[c.kategori];
            return (
              <button
                key={c.kode}
                onClick={() => !used && onAdd(c)}
                disabled={used}
                title={c.deskripsi}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[10px] transition",
                  used
                    ? "border-slate-100 bg-slate-50 text-slate-400 cursor-default"
                    : "border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
                )}
              >
                <span className={cn(
                  "rounded px-1 py-0.5 font-mono text-[10px] font-black",
                  used ? "bg-slate-100 text-slate-400" : cn(cfg.bg, cfg.text),
                )}>
                  {c.kode}
                </span>
                <span className="flex-1 truncate font-semibold">{c.nama}</span>
                {used ? (
                  <span className="text-[9px] text-slate-400">✓</span>
                ) : (
                  <Plus size={9} className="text-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-[9px] leading-relaxed text-emerald-700/70">
        Sumber: BPJS Kesehatan V-Claim API (field <span className="font-mono">ruang</span>) ·
        PMK 56/2014 (klasifikasi RS) · konvensi SIMRS Indonesia.
      </p>
    </div>
  );
}
