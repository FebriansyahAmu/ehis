"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, X, ChevronDown, AlertTriangle, CheckCircle2,
  Tag, Stethoscope, BookOpen, Activity,
} from "lucide-react";
import type { IGDPatientDetail, DiagnosaTipe, IGDDiagnosa } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Catalogs ──────────────────────────────────────────────

interface CatalogEntry { kode: string; nama: string; kategori: string }

const ICD10: CatalogEntry[] = [
  { kode: "I10",    nama: "Essential (primary) hypertension",                           kategori: "Kardiovaskular" },
  { kode: "I21.0",  nama: "Acute transmural MI of anterior wall",                       kategori: "Kardiovaskular" },
  { kode: "I21.4",  nama: "Non-ST elevation myocardial infarction",                     kategori: "Kardiovaskular" },
  { kode: "I50.0",  nama: "Congestive heart failure",                                   kategori: "Kardiovaskular" },
  { kode: "I63.9",  nama: "Cerebral infarction, unspecified",                           kategori: "Kardiovaskular" },
  { kode: "R57.0",  nama: "Cardiogenic shock",                                          kategori: "Kardiovaskular" },
  { kode: "I48",    nama: "Atrial fibrillation and flutter",                            kategori: "Kardiovaskular" },
  { kode: "I20.0",  nama: "Unstable angina",                                            kategori: "Kardiovaskular" },
  { kode: "E11.9",  nama: "Type 2 diabetes mellitus without complications",             kategori: "Metabolik"      },
  { kode: "E11.65", nama: "Type 2 diabetes mellitus with hyperglycemia",                kategori: "Metabolik"      },
  { kode: "E16.0",  nama: "Drug-induced hypoglycaemia without coma",                    kategori: "Metabolik"      },
  { kode: "E78.5",  nama: "Hyperlipidaemia, unspecified",                               kategori: "Metabolik"      },
  { kode: "E87.1",  nama: "Hypo-osmolality and hyponatraemia",                          kategori: "Metabolik"      },
  { kode: "E86.0",  nama: "Dehydration",                                                kategori: "Metabolik"      },
  { kode: "J18.9",  nama: "Pneumonia, unspecified organism",                            kategori: "Pernapasan"     },
  { kode: "J44.1",  nama: "COPD with acute exacerbation",                               kategori: "Pernapasan"     },
  { kode: "J45.9",  nama: "Asthma, unspecified",                                        kategori: "Pernapasan"     },
  { kode: "J96.0",  nama: "Acute respiratory failure",                                  kategori: "Pernapasan"     },
  { kode: "J22",    nama: "Unspecified acute lower respiratory infection",               kategori: "Pernapasan"     },
  { kode: "K25.0",  nama: "Gastric ulcer, acute with haemorrhage",                      kategori: "Pencernaan"     },
  { kode: "K29.7",  nama: "Gastritis, unspecified",                                     kategori: "Pencernaan"     },
  { kode: "K35.2",  nama: "Acute appendicitis with generalized peritonitis",            kategori: "Pencernaan"     },
  { kode: "K92.1",  nama: "Melaena",                                                    kategori: "Pencernaan"     },
  { kode: "G40.9",  nama: "Epilepsy, unspecified",                                      kategori: "Neurologi"      },
  { kode: "G43.9",  nama: "Migraine, unspecified",                                      kategori: "Neurologi"      },
  { kode: "R55",    nama: "Syncope and collapse",                                        kategori: "Neurologi"      },
  { kode: "S06.0",  nama: "Concussion",                                                 kategori: "Neurologi"      },
  { kode: "G35",    nama: "Multiple sclerosis",                                          kategori: "Neurologi"      },
  { kode: "S52.5",  nama: "Fracture of lower end of radius",                            kategori: "Trauma"         },
  { kode: "S72.0",  nama: "Fracture of neck of femur",                                  kategori: "Trauma"         },
  { kode: "T14.1",  nama: "Open wound of unspecified body region",                      kategori: "Trauma"         },
  { kode: "S22.0",  nama: "Fracture of thoracic vertebra",                              kategori: "Trauma"         },
  { kode: "A09",    nama: "Gastroenteritis and colitis of infectious origin",            kategori: "Infeksi"        },
  { kode: "A41.9",  nama: "Sepsis, unspecified organism",                               kategori: "Infeksi"        },
  { kode: "N30.0",  nama: "Acute cystitis",                                             kategori: "Infeksi"        },
  { kode: "N10",    nama: "Acute pyelonephritis",                                       kategori: "Infeksi"        },
  { kode: "B34.9",  nama: "Viral infection, unspecified",                               kategori: "Infeksi"        },
];

const ICD9: CatalogEntry[] = [
  { kode: "89.52",  nama: "Elektrokardiogram (EKG)",                                    kategori: "Diagnostik"     },
  { kode: "89.61",  nama: "Pemeriksaan tekanan darah",                                  kategori: "Diagnostik"     },
  { kode: "89.39",  nama: "Observasi dan evaluasi lainnya",                             kategori: "Diagnostik"     },
  { kode: "88.72",  nama: "CT Scan toraks",                                             kategori: "Radiologi"      },
  { kode: "88.71",  nama: "CT Scan kepala",                                             kategori: "Radiologi"      },
  { kode: "87.44",  nama: "Foto rontgen toraks",                                        kategori: "Radiologi"      },
  { kode: "88.76",  nama: "CT Scan abdomen",                                            kategori: "Radiologi"      },
  { kode: "88.79",  nama: "USG abdomen",                                                kategori: "Radiologi"      },
  { kode: "93.90",  nama: "Pemberian oksigen tambahan kontinyu (NRM/nasal canul)",      kategori: "Terapi"         },
  { kode: "99.15",  nama: "Infus dekstrosa",                                            kategori: "Terapi"         },
  { kode: "99.18",  nama: "Injeksi/infus elektrolit",                                   kategori: "Terapi"         },
  { kode: "99.21",  nama: "Injeksi insulin",                                            kategori: "Terapi"         },
  { kode: "99.29",  nama: "Injeksi obat lainnya",                                       kategori: "Terapi"         },
  { kode: "38.93",  nama: "Pemasangan akses vena sentral",                              kategori: "Prosedur"       },
  { kode: "38.99",  nama: "Pemasangan IV line perifer",                                 kategori: "Prosedur"       },
  { kode: "96.04",  nama: "Intubasi trakea",                                            kategori: "Prosedur"       },
  { kode: "96.71",  nama: "Ventilasi mekanik < 96 jam",                                 kategori: "Prosedur"       },
  { kode: "57.94",  nama: "Pemasangan kateter urin",                                    kategori: "Prosedur"       },
  { kode: "54.91",  nama: "Aspirasi peritoneal",                                        kategori: "Prosedur"       },
  { kode: "86.59",  nama: "Penutupan luka/hecting",                                     kategori: "Prosedur"       },
  { kode: "79.39",  nama: "Reposisi fraktur tertutup",                                  kategori: "Prosedur"       },
  { kode: "90.59",  nama: "Pemeriksaan laboratorium darah lengkap",                     kategori: "Laboratorium"   },
  { kode: "90.55",  nama: "Pemeriksaan kimia darah (enzim jantung/troponin)",           kategori: "Laboratorium"   },
  { kode: "90.51",  nama: "Pemeriksaan gula darah sewaktu",                             kategori: "Laboratorium"   },
  { kode: "90.09",  nama: "Pemeriksaan analisis gas darah (AGD)",                       kategori: "Laboratorium"   },
];

// ── Tipe configs ──────────────────────────────────────────

const TIPE_CONFIG: Record<DiagnosaTipe, {
  bg: string; text: string; ring: string; dot: string; accentBorder: string;
}> = {
  Utama:      { bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200",  dot: "bg-indigo-500",  accentBorder: "border-l-indigo-400"  },
  Sekunder:   { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     dot: "bg-sky-500",     accentBorder: "border-l-sky-400"     },
  Komplikasi: { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-400",   accentBorder: "border-l-amber-400"   },
  Komorbid:   { bg: "bg-slate-100",  text: "text-slate-600",   ring: "ring-slate-200",   dot: "bg-slate-400",   accentBorder: "border-l-slate-300"   },
};

const TIPE_ORDER: DiagnosaTipe[] = ["Utama", "Sekunder", "Komplikasi", "Komorbid"];

// ── DiagnosaRow — compact, list only ─────────────────────

function DiagnosaRow({
  diag, onRemove, onChangeTipe,
}: {
  diag: IGDDiagnosa;
  onRemove: () => void;
  onChangeTipe: (t: DiagnosaTipe) => void;
}) {
  const [tipeOpen, setTipeOpen] = useState(false);
  const tipeRef = useRef<HTMLDivElement>(null);
  const c = TIPE_CONFIG[diag.tipe];

  useEffect(() => {
    if (!tipeOpen) return;
    const fn = (e: MouseEvent) => {
      if (tipeRef.current && !tipeRef.current.contains(e.target as Node)) setTipeOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [tipeOpen]);

  return (
    <li className={cn(
      "flex items-center gap-2 border-b border-slate-100 border-l-2 px-3 py-2.5 last:border-b-0 transition-colors hover:bg-slate-50/60",
      c.accentBorder,
    )}>
      <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-slate-600">
        {diag.kodeIcd10}
      </span>
      <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-slate-800">
        {diag.namaDiagnosis}
      </p>

      {/* Tipe dropdown */}
      <div className="relative shrink-0" ref={tipeRef}>
        <button
          onClick={() => setTipeOpen(v => !v)}
          title="Ganti tipe"
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 transition hover:opacity-75",
            c.bg, c.text, c.ring,
          )}
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
          {diag.tipe}
          <ChevronDown size={8} />
        </button>
        {tipeOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white py-0.5 shadow-md">
            {TIPE_ORDER.map(t => (
              <button
                key={t}
                onClick={() => { onChangeTipe(t); setTipeOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-xs transition hover:bg-slate-50",
                  t === diag.tipe && "font-semibold",
                )}
              >
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TIPE_CONFIG[t].dot)} />
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        aria-label="Hapus diagnosis"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-rose-100 bg-rose-50 text-rose-400 transition hover:bg-rose-100 hover:text-rose-600"
      >
        <X size={11} />
      </button>
    </li>
  );
}

// ── Search + add panel ────────────────────────────────────

type IcdVersion = "ICD-10" | "ICD-9";

function SearchPanel({
  onAdd, hasUtama,
}: {
  onAdd: (entry: CatalogEntry, tipe: DiagnosaTipe, alasan: string, analisa: string, catatan: string) => void;
  hasUtama: boolean;
}) {
  const [version, setVersion]   = useState<IcdVersion>("ICD-10");
  const [query, setQuery]       = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [tipe, setTipe]         = useState<DiagnosaTipe>("Sekunder");
  const [alasan, setAlasan]     = useState("");
  const [analisa, setAnalisa]   = useState("");
  const [catatan, setCatatan]   = useState("");
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const catalog = version === "ICD-10" ? ICD10 : ICD9;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { setDropOpen(false); setQuery(""); } };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const results = query.trim().length >= 2
    ? catalog.filter(e =>
        e.kode.toLowerCase().includes(query.toLowerCase()) ||
        e.nama.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 8)
    : [];

  const groups = results.reduce<Record<string, CatalogEntry[]>>((acc, e) => {
    (acc[e.kategori] ??= []).push(e);
    return acc;
  }, {});

  const handleSelect = (entry: CatalogEntry) => {
    setSelected(entry);
    setQuery("");
    setDropOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    setAlasan(""); setAnalisa(""); setCatatan("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected, tipe, alasan, analisa, catatan);
    setSelected(null);
    setAlasan(""); setAnalisa(""); setCatatan("");
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ICD version toggle */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
        {(["ICD-10", "ICD-9"] as IcdVersion[]).map(v => (
          <button
            key={v}
            onClick={() => { setVersion(v); setQuery(""); setDropOpen(false); setSelected(null); }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-xs font-semibold transition",
              version === v
                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {v === "ICD-10" ? <BookOpen size={11} /> : <Activity size={11} />}
            {v}
          </button>
        ))}
      </div>

      {/* Search or selected chip */}
      {selected ? (
        <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <span className="font-mono text-[10px] font-bold text-indigo-600">{selected.kode}</span>
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-indigo-800">{selected.nama}</p>
            <span className="mt-1 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-500">
              {selected.kategori}
            </span>
          </div>
          <button
            onClick={handleClear}
            aria-label="Ganti pilihan"
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-indigo-300 hover:bg-indigo-100 hover:text-indigo-600"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <div className="relative" ref={wrapRef}>
          <div className="relative">
            <Search size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder={version === "ICD-10" ? "Cari kode / nama diagnosis…" : "Cari kode / nama prosedur…"}
              onChange={(e) => { setQuery(e.target.value); setDropOpen(true); }}
              onFocus={() => query && setDropOpen(true)}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-7 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setDropOpen(false); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X size={11} />
              </button>
            )}
          </div>
          {dropOpen && results.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {Object.entries(groups).map(([kat, items]) => (
                <div key={kat}>
                  <div className="sticky top-0 border-b border-slate-100 bg-slate-50/95 px-2.5 py-1 backdrop-blur-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{kat}</span>
                  </div>
                  {items.map(item => (
                    <button
                      key={item.kode}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                      className="flex w-full items-start gap-2 px-2.5 py-2 text-left transition hover:bg-indigo-50"
                    >
                      <span className="mt-px w-11 shrink-0 font-mono text-[10px] font-bold text-indigo-600">{item.kode}</span>
                      <span className="text-[11px] leading-snug text-slate-700">{item.nama}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
          {dropOpen && query.trim().length >= 2 && results.length === 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-lg text-center">
              <p className="text-xs text-slate-400">Tidak ditemukan</p>
            </div>
          )}
        </div>
      )}

      {/* Form fields — show after selection */}
      {selected && (
        <>
          {/* Tipe selector */}
          <div>
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Tipe Diagnosis</p>
            <div className="grid grid-cols-2 gap-1">
              {TIPE_ORDER.map(t => {
                const c = TIPE_CONFIG[t];
                const active = tipe === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTipe(t)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ring-1 transition",
                      active ? cn(c.bg, c.text, c.ring) : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? c.dot : "bg-slate-300")} />
                    {t}
                    {t === "Utama" && hasUtama && <span className="ml-auto text-[9px] opacity-50">✓</span>}
                  </button>
                );
              })}
            </div>
            {tipe === "Utama" && hasUtama && (
              <p className="mt-1.5 text-[10px] text-amber-600">
                Menambah Utama baru akan menggeser yang lama ke Sekunder.
              </p>
            )}
          </div>

          {/* Alasan */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Alasan / Indikasi
            </label>
            <input
              type="text"
              value={alasan}
              onChange={e => setAlasan(e.target.value)}
              placeholder="Mengapa diagnosis ini ditegakkan…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Analisa klinis */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Analisa Klinis Dokter
            </label>
            <textarea
              rows={3}
              value={analisa}
              onChange={e => setAnalisa(e.target.value)}
              placeholder="Temuan pemeriksaan dan dasar penegakan diagnosis…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Catatan tambahan */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Catatan Tambahan
              <span className="ml-1 font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Informasi lain yang relevan…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            Tambah Diagnosis
          </button>
        </>
      )}

      {!selected && (
        <p className="text-[10px] leading-relaxed text-slate-400">
          {version === "ICD-10"
            ? "ICD-10: kode diagnosis penyakit. Ketik min. 2 karakter."
            : "ICD-9-CM: kode prosedur dan tindakan. Ketik min. 2 karakter."}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function DiagnosaTab({ patient }: { patient: IGDPatientDetail }) {
  const [diagnosa, setDiagnosa] = useState<IGDDiagnosa[]>(patient.diagnosa);

  const hasUtama = diagnosa.some(d => d.tipe === "Utama");

  const addDiagnosis = (entry: CatalogEntry, tipe: DiagnosaTipe, _alasan: string, _analisa: string, _catatan: string) => {
    if (diagnosa.some(d => d.kodeIcd10 === entry.kode)) return;
    if (tipe === "Utama" && hasUtama) {
      setDiagnosa(prev => prev.map(d => d.tipe === "Utama" ? { ...d, tipe: "Sekunder" } : d));
    }
    setDiagnosa(prev => [...prev, {
      id: `d-${Date.now()}`,
      kodeIcd10: entry.kode,
      namaDiagnosis: entry.nama,
      tipe,
    }]);
  };

  const removeDiagnosis = (id: string) => setDiagnosa(prev => prev.filter(d => d.id !== id));

  const changeTipe = (id: string, tipe: DiagnosaTipe) => {
    if (tipe === "Utama") {
      setDiagnosa(prev => prev.map(d =>
        d.id === id ? { ...d, tipe: "Utama" }
        : d.tipe === "Utama" ? { ...d, tipe: "Sekunder" }
        : d,
      ));
    } else {
      setDiagnosa(prev => prev.map(d => d.id === id ? { ...d, tipe } : d));
    }
  };

  const sorted = [...diagnosa].sort(
    (a, b) => TIPE_ORDER.indexOf(a.tipe) - TIPE_ORDER.indexOf(b.tipe),
  );

  const counts = TIPE_ORDER.reduce<Record<DiagnosaTipe, number>>((acc, t) => {
    acc[t] = diagnosa.filter(d => d.tipe === t).length;
    return acc;
  }, {} as Record<DiagnosaTipe, number>);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">

      {/* ── Left: diagnosis list ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">

        {/* Header with tipe summary */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs">
            <Tag size={11} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Diagnosis</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {diagnosa.length}
            </span>
          </div>
          {TIPE_ORDER.filter(t => counts[t] > 0).map(t => {
            const c = TIPE_CONFIG[t];
            return (
              <span key={t} className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ring-1",
                c.bg, c.text, c.ring,
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                {counts[t]} {t}
              </span>
            );
          })}
        </div>

        {/* Diagnosis list */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                <Stethoscope size={18} />
              </div>
              <p className="text-xs text-slate-400">Belum ada diagnosis</p>
              <p className="text-[10px] text-slate-300">Cari ICD-10/ICD-9 dari panel kanan</p>
            </div>
          ) : (
            <ul>
              {sorted.map(diag => (
                <DiagnosaRow
                  key={diag.id}
                  diag={diag}
                  onRemove={() => removeDiagnosis(diag.id)}
                  onChangeTipe={(t) => changeTipe(diag.id, t)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Status alert */}
        {diagnosa.length > 0 && !hasUtama && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">
              Belum ada <strong>Diagnosis Utama</strong>. Klik badge tipe pada baris untuk mengubahnya.
            </p>
          </div>
        )}
        {diagnosa.length > 0 && hasUtama && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
            <p className="text-xs text-emerald-700">Diagnosis utama sudah ditegakkan.</p>
          </div>
        )}
      </div>

      {/* ── Right: search panel ── */}
      <div className="shrink-0 lg:w-96 xl:w-105">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Search size={11} className="text-indigo-500" />
            <p className="text-xs font-semibold text-slate-700">Tambah Kode</p>
          </div>
          <SearchPanel onAdd={addDiagnosis} hasUtama={hasUtama} />
        </div>
      </div>

    </div>
  );
}
