"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, CheckCircle2, FlaskConical, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LabOrder, type LabOrderItem, type KategoriLab, KATEGORI_CFG } from "../labShared";

interface Props { order: LabOrder }

// ── Add-on test catalog ───────────────────────────────────

interface AddOnTestDef {
  kode:        string;
  nama:        string;
  kategori:    KategoriLab;
  waktuTunggu: string;
  isSpecial?:  boolean;
}

const ADDON_CATALOG: AddOnTestDef[] = [
  { kode: "LAB-K001", nama: "Gula Darah Sewaktu (GDS)",        kategori: "Kimia Klinik",      waktuTunggu: "15 mnt"  },
  { kode: "LAB-K002", nama: "Gula Darah Puasa (GDP)",          kategori: "Kimia Klinik",      waktuTunggu: "15 mnt"  },
  { kode: "LAB-K003", nama: "HbA1c",                           kategori: "Kimia Klinik",      waktuTunggu: "2 jam"   },
  { kode: "LAB-K005", nama: "SGOT / AST",                      kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K006", nama: "SGPT / ALT",                      kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K007", nama: "Ureum",                           kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K008", nama: "Kreatinin",                       kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K010", nama: "Asam Urat",                       kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K011", nama: "Kolesterol Total",                 kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K012", nama: "Trigliserida",                     kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K013", nama: "HDL Kolesterol",                  kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K014", nama: "LDL Kolesterol",                  kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K015", nama: "Bilirubin Total",                  kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K016", nama: "Protein Total / Albumin",         kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K017", nama: "LDH (Laktat Dehidrogenase)",      kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K018", nama: "Troponin I",                      kategori: "Kimia Klinik",      waktuTunggu: "30 mnt", isSpecial: true },
  { kode: "LAB-K019", nama: "Prokalsitonin (PCT)",             kategori: "Kimia Klinik",      waktuTunggu: "2 jam",  isSpecial: true },
  { kode: "LAB-K020", nama: "CRP Kuantitatif",                 kategori: "Kimia Klinik",      waktuTunggu: "1 jam"   },
  { kode: "LAB-K021", nama: "BNP",                             kategori: "Kimia Klinik",      waktuTunggu: "2 jam",  isSpecial: true },
  { kode: "LAB-H002", nama: "Retikulosit",                     kategori: "Hematologi",        waktuTunggu: "1 jam"   },
  { kode: "LAB-H003", nama: "Morfologi Darah Tepi (MDT)",      kategori: "Hematologi",        waktuTunggu: "3 jam"   },
  { kode: "LAB-H004", nama: "Golongan Darah ABO + Rh",        kategori: "Hematologi",        waktuTunggu: "30 mnt"  },
  { kode: "LAB-K004", nama: "PT / APTT",                       kategori: "Koagulasi",         waktuTunggu: "1 jam"   },
  { kode: "LAB-K022", nama: "D-Dimer",                         kategori: "Koagulasi",         waktuTunggu: "1 jam"   },
  { kode: "LAB-U001", nama: "Urinalisis Lengkap",              kategori: "Urinalisis",        waktuTunggu: "30 mnt"  },
  { kode: "LAB-U002", nama: "Sedimen Urin",                    kategori: "Urinalisis",        waktuTunggu: "45 mnt"  },
  { kode: "LAB-S001", nama: "Widal",                           kategori: "Serologi",          waktuTunggu: "2 jam"   },
  { kode: "LAB-S002", nama: "NS1 Antigen Dengue",             kategori: "Serologi",          waktuTunggu: "1 jam", isSpecial: true },
  { kode: "LAB-S003", nama: "Anti-HIV",                        kategori: "Serologi",          waktuTunggu: "1 jam", isSpecial: true },
  { kode: "LAB-S004", nama: "HBsAg",                          kategori: "Serologi",          waktuTunggu: "1 jam"   },
];

// Session store for add-on items per order
const _addonStore = new Map<string, LabOrderItem[]>();

function getAddOns(orderId: string): LabOrderItem[] {
  return _addonStore.get(orderId) ?? [];
}

function saveAddOns(orderId: string, items: LabOrderItem[]): void {
  _addonStore.set(orderId, items);
}

// ── Specimen Validity ─────────────────────────────────────

const VALIDITY_HOURS: Record<KategoriLab, number> = {
  "Hematologi":        4,
  "Kimia Klinik":      6,
  "Urinalisis":        2,
  "Koagulasi":         4,
  "Serologi":          24,
  "Analisa Gas Darah": 0.5,
  "Mikrobiologi":      0,  // no add-on for culture
  "Imunologi":         24,
  "Toksikologi":       6,
  "Feses":             0,  // no add-on for feses
};

function getSpecimenAgeHours(waktuTerima?: string): number | null {
  if (!waktuTerima) return null;
  const today = new Date().toISOString().slice(0, 10);
  const ts = new Date(`${today}T${waktuTerima}`);
  return (Date.now() - ts.getTime()) / 3_600_000;
}

// ── Main ──────────────────────────────────────────────────

export default function AddOnPane({ order }: Props) {
  const [addOns,  setAddOns]  = useState<LabOrderItem[]>(() => getAddOns(order.id));
  const [query,   setQuery]   = useState("");
  const [saved,   setSaved]   = useState(false);

  const existingCodes = useMemo(
    () => new Set([...order.items.map((i) => i.kode), ...addOns.map((i) => i.kode)]),
    [order.items, addOns],
  );

  const specimenAge = getSpecimenAgeHours(order.specimen?.waktuTerima);
  const isRejected  = order.status === "Ditolak";
  const hasSpecimen = !!order.specimen?.noRegistrasi;

  const filtered = useMemo(() => {
    if (!query.trim()) return ADDON_CATALOG.slice(0, 12);
    const q = query.toLowerCase();
    return ADDON_CATALOG.filter((t) =>
      t.nama.toLowerCase().includes(q) || t.kode.toLowerCase().includes(q) || t.kategori.toLowerCase().includes(q),
    );
  }, [query]);

  function addTest(test: AddOnTestDef) {
    if (existingCodes.has(test.kode)) return;
    const item: LabOrderItem = {
      id:          `ao-${Date.now()}`,
      kode:        test.kode,
      nama:        test.nama,
      kategori:    test.kategori,
      waktuTunggu: test.waktuTunggu,
      isSpecial:   test.isSpecial,
    };
    const next = [...addOns, item];
    setAddOns(next);
    saveAddOns(order.id, next);
  }

  function removeTest(id: string) {
    const next = addOns.filter((i) => i.id !== id);
    setAddOns(next);
    saveAddOns(order.id, next);
  }

  function handleSubmit() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const noAddOnReason = isRejected
    ? "Specimen ditolak — add-on tidak dapat dilakukan"
    : !hasSpecimen
    ? "Specimen belum diregistrasi di lab"
    : null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_280px]">

      {/* Left — catalog + cart */}
      <div className="space-y-4">

        {/* Specimen validity banner */}
        {hasSpecimen && !isRejected && (
          <div className={cn(
            "flex items-start gap-3 rounded-xl border p-3",
            specimenAge !== null && specimenAge < 4
              ? "border-emerald-200 bg-emerald-50"
              : specimenAge !== null && specimenAge < 8
              ? "border-amber-200 bg-amber-50"
              : "border-rose-200 bg-rose-50",
          )}>
            <FlaskConical size={15} className={cn(
              "mt-0.5 shrink-0",
              specimenAge !== null && specimenAge < 4 ? "text-emerald-600" :
              specimenAge !== null && specimenAge < 8 ? "text-amber-600" : "text-rose-600",
            )} />
            <div>
              <p className="text-[12px] font-bold text-slate-700">
                Specimen No. {order.specimen?.noRegistrasi}
              </p>
              <p className="text-[11px] text-slate-500">
                Terima pukul {order.specimen?.waktuTerima} · Kondisi {order.specimen?.kondisi}
                {specimenAge !== null && (
                  <span className="ml-1">· Usia sampel ≈ {specimenAge.toFixed(1)} jam</span>
                )}
              </p>
            </div>
          </div>
        )}

        {noAddOnReason && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-rose-200 py-12 text-center">
            <X size={24} className="text-rose-300" />
            <p className="text-sm text-rose-400">{noAddOnReason}</p>
          </div>
        )}

        {!noAddOnReason && (
          <>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari pemeriksaan (nama / kode / kategori)…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Catalog grid */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filtered.map((test) => {
                const already  = existingCodes.has(test.kode);
                const kCfg     = KATEGORI_CFG[test.kategori];
                const ageHours = specimenAge ?? 0;
                const maxAge   = VALIDITY_HOURS[test.kategori];
                const expired  = maxAge > 0 && ageHours > maxAge;
                return (
                  <button
                    key={test.kode}
                    onClick={() => !already && !expired && addTest(test)}
                    disabled={already || expired}
                    className={cn(
                      "rounded-xl border p-2.5 text-left transition-all",
                      already
                        ? "border-emerald-200 bg-emerald-50 opacity-70 cursor-default"
                        : expired
                        ? "border-rose-100 bg-rose-50/30 opacity-50 cursor-not-allowed"
                        : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-sm cursor-pointer",
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[11px] font-semibold text-slate-700">{test.nama}</p>
                        <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", kCfg.badge.replace("ring-1", ""))}>
                            {kCfg.abbrev}
                          </span>
                          <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                            <Clock size={8} />{test.waktuTunggu}
                          </span>
                          {test.isSpecial && (
                            <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold text-rose-600 ring-1 ring-rose-200">⚡</span>
                          )}
                        </div>
                      </div>
                      {already ? (
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : expired ? (
                        <span className="text-[9px] text-rose-400 shrink-0">Exp.</span>
                      ) : (
                        <Plus size={14} className="text-sky-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add-on cart */}
            {addOns.length > 0 && (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 space-y-2">
                <p className="text-[11px] font-bold text-sky-800">Add-on yang Ditambahkan ({addOns.length})</p>
                <AnimatePresence>
                  {addOns.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                    >
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700">{item.nama}</p>
                        <p className="text-[10px] text-slate-400">{item.kode} · {item.waktuTunggu}</p>
                      </div>
                      <button onClick={() => removeTest(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  {saved ? (
                    <><CheckCircle2 size={14} /> Add-on Diajukan!</>
                  ) : (
                    <><FlaskConical size={14} /> Ajukan Add-on ({addOns.length} pemeriksaan)</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right — info panel */}
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Add-on Test</h4>
          <div className="space-y-2.5 text-[11px] text-slate-600">
            <p>Tambah pemeriksaan pada specimen yang sudah ada tanpa pengambilan ulang, selama specimen masih valid.</p>
            <div className="space-y-1.5 pt-1">
              {([
                ["Hematologi (EDTA)",   "4 jam"],
                ["Kimia Klinik (SST)",  "6 jam"],
                ["Koagulasi (Citrat)",  "4 jam"],
                ["Serologi (SST)",      "24 jam"],
                ["Urinalisis",          "2 jam"],
                ["Analisa Gas Darah",   "30 mnt"],
                ["Kultur / Mikrobiologi", "Tidak bisa add-on"],
              ] as [string, string][]).map(([kat, dur]) => (
                <div key={kat} className="flex items-center justify-between">
                  <span className="text-slate-500">{kat}</span>
                  <span className={cn(
                    "font-semibold",
                    dur === "Tidak bisa add-on" ? "text-rose-500" : "text-emerald-700",
                  )}>{dur}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[9px] text-slate-400">ISO 15189:2022 §5.4 · Operational Best Practice</p>
        </div>

        {/* Current order items */}
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Pemeriksaan Aktif</p>
          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 truncate">{item.nama}</span>
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
