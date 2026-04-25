"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  Stethoscope,
  FlaskConical,
  Syringe,
  ScanLine,
  Activity,
  Wrench,
  Zap,
} from "lucide-react";
import type { IGDPatientDetail, IGDTindakanItem } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────

interface TindakanEntry {
  kode: string;
  nama: string;
  kategori: string;
}
type LocalTindakan = IGDTindakanItem & { kategori?: string };

// ── Catalog ───────────────────────────────────────────────

const CATALOG: TindakanEntry[] = [
  { kode: "89.52", nama: "Elektrokardiogram (EKG)", kategori: "Diagnostik" },
  { kode: "89.61", nama: "Pemeriksaan tekanan darah", kategori: "Diagnostik" },
  { kode: "89.39", nama: "Observasi dan evaluasi", kategori: "Diagnostik" },
  { kode: "88.72", nama: "CT Scan toraks", kategori: "Radiologi" },
  { kode: "88.71", nama: "CT Scan kepala", kategori: "Radiologi" },
  { kode: "87.44", nama: "Foto rontgen toraks", kategori: "Radiologi" },
  { kode: "88.76", nama: "CT Scan abdomen", kategori: "Radiologi" },
  { kode: "88.79", nama: "USG abdomen", kategori: "Radiologi" },
  {
    kode: "93.90",
    nama: "Pemberian oksigen (NRM / nasal canul)",
    kategori: "Terapi",
  },
  { kode: "99.15", nama: "Infus dekstrosa", kategori: "Terapi" },
  { kode: "99.18", nama: "Injeksi / infus elektrolit", kategori: "Terapi" },
  { kode: "99.21", nama: "Injeksi insulin", kategori: "Terapi" },
  { kode: "99.29", nama: "Injeksi obat lainnya", kategori: "Terapi" },
  {
    kode: "38.93",
    nama: "Pemasangan akses vena sentral",
    kategori: "Prosedur",
  },
  { kode: "38.99", nama: "Pemasangan IV line perifer", kategori: "Prosedur" },
  { kode: "96.04", nama: "Intubasi trakea", kategori: "Prosedur" },
  { kode: "96.71", nama: "Ventilasi mekanik < 96 jam", kategori: "Prosedur" },
  { kode: "57.94", nama: "Pemasangan kateter urin", kategori: "Prosedur" },
  { kode: "54.91", nama: "Aspirasi peritoneal", kategori: "Prosedur" },
  { kode: "86.59", nama: "Penutupan luka / hecting", kategori: "Prosedur" },
  { kode: "79.39", nama: "Reposisi fraktur tertutup", kategori: "Prosedur" },
  { kode: "90.59", nama: "Darah lengkap", kategori: "Laboratorium" },
  {
    kode: "90.55",
    nama: "Kimia darah — enzim jantung / troponin",
    kategori: "Laboratorium",
  },
  { kode: "90.51", nama: "Gula darah sewaktu", kategori: "Laboratorium" },
  { kode: "90.09", nama: "Analisis gas darah (AGD)", kategori: "Laboratorium" },
];

const KODE_TO_ENTRY = new Map(CATALOG.map((e) => [e.kode, e]));

const KAT_CFG: Record<
  string,
  {
    icon: React.ReactNode;
    dot: string;
    text: string;
    bg: string;
    ring: string;
    accentBorder: string;
  }
> = {
  Diagnostik: {
    icon: <Activity size={10} />,
    dot: "bg-sky-500",
    text: "text-sky-700",
    bg: "bg-sky-50",
    ring: "ring-sky-200",
    accentBorder: "border-l-sky-400",
  },
  Radiologi: {
    icon: <ScanLine size={10} />,
    dot: "bg-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
    accentBorder: "border-l-violet-400",
  },
  Terapi: {
    icon: <Syringe size={10} />,
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    accentBorder: "border-l-emerald-400",
  },
  Prosedur: {
    icon: <Wrench size={10} />,
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    accentBorder: "border-l-amber-400",
  },
  Laboratorium: {
    icon: <FlaskConical size={10} />,
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    accentBorder: "border-l-rose-400",
  },
};
const KAT_DEFAULT = {
  icon: <Zap size={10} />,
  dot: "bg-slate-400",
  text: "text-slate-600",
  bg: "bg-slate-50",
  ring: "ring-slate-200",
  accentBorder: "border-l-slate-400",
};

function katCfg(k?: string) {
  return k ? (KAT_CFG[k] ?? KAT_DEFAULT) : KAT_DEFAULT;
}

// ── Tindakan Row ──────────────────────────────────────────

function TindakanRow({
  item,
  onRemove,
  onChangeJumlah,
}: {
  item: LocalTindakan;
  onRemove: () => void;
  onChangeJumlah: (n: number) => void;
}) {
  const cfg = katCfg(item.kategori);
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 border-l-2 px-3 py-2.5 transition-colors hover:bg-slate-50",
        cfg.accentBorder,
      )}
    >
      {/* Chip */}
      <span
        className={cn(
          "hidden sm:flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1",
          cfg.bg,
          cfg.text,
          cfg.ring,
        )}
      >
        {cfg.icon}
        <span className="hidden md:inline">{item.kategori ?? "—"}</span>
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800">
          {item.nama}
        </p>
        <p className="font-mono text-[10px] text-slate-400">
          {item.kode}
          {item.dilakukanOleh ? ` · ${item.dilakukanOleh}` : ""}
          {item.waktu ? ` · ${item.waktu}` : ""}
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onChangeJumlah(Math.max(1, item.jumlah - 1))}
          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
        >
          <Minus size={9} />
        </button>
        <span className="w-5 text-center text-xs font-bold text-slate-800">
          {item.jumlah}
        </span>
        <button
          onClick={() => onChangeJumlah(item.jumlah + 1)}
          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
        >
          <Plus size={9} />
        </button>
        <span className="text-[10px] text-slate-400">×</span>
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={12} />
      </button>
    </li>
  );
}

// ── Search Panel ──────────────────────────────────────────

function SearchPanel({
  onAdd,
  existingKodes,
}: {
  onAdd: (entry: TindakanEntry, jumlah: number, pelaksana: string) => void;
  existingKodes: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [selected, setSelected] = useState<TindakanEntry | null>(null);
  const [jumlah, setJumlah] = useState(1);
  const [pelaksana, setPelaksana] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered =
    q.length < 1
      ? []
      : CATALOG.filter(
          (e) =>
            e.nama.toLowerCase().includes(q) ||
            e.kode.toLowerCase().includes(q) ||
            e.kategori.toLowerCase().includes(q),
        );

  const grouped = filtered.reduce<Record<string, TindakanEntry[]>>((acc, e) => {
    (acc[e.kategori] ??= []).push(e);
    return acc;
  }, {});

  function handleSelect(entry: TindakanEntry) {
    setSelected(entry);
    setQuery(entry.nama);
    setDropOpen(false);
  }

  function handleAdd() {
    if (!selected || existingKodes.has(selected.kode)) return;
    onAdd(selected, jumlah, pelaksana.trim() || "dr. IGD");
    setSelected(null);
    setQuery("");
    setJumlah(1);
    setPelaksana("");
  }

  const alreadyAdded = selected ? existingKodes.has(selected.kode) : false;

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div ref={wrapRef} className="relative">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Cari Tindakan
        </label>
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropOpen(true);
              if (selected && e.target.value !== selected.nama)
                setSelected(null);
            }}
            onFocus={() => q && setDropOpen(true)}
            placeholder="Nama, kode, atau kategori..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSelected(null);
                setDropOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {dropOpen && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {Object.entries(grouped).map(([kat, entries]) => {
              const cfg = katCfg(kat);
              return (
                <div key={kat}>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
                      cfg.text,
                    )}
                  >
                    {cfg.icon}
                    {kat}
                  </div>
                  {entries.map((e) => {
                    const added = existingKodes.has(e.kode);
                    return (
                      <button
                        key={e.kode}
                        disabled={added}
                        onClick={() => handleSelect(e)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
                          added
                            ? "cursor-default opacity-40"
                            : "hover:bg-indigo-50",
                        )}
                      >
                        <span className="font-mono text-[10px] text-slate-400 w-10 shrink-0">
                          {e.kode}
                        </span>
                        <span className="text-xs text-slate-700">{e.nama}</span>
                        {added && (
                          <span className="ml-auto text-[10px] text-slate-400 shrink-0">
                            sudah ada
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {dropOpen && q.length > 0 && filtered.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-3 text-center text-xs text-slate-400 shadow-lg">
            Tidak ditemukan
          </div>
        )}
      </div>

      {/* Form after selection */}
      {selected && (
        <div className="flex flex-col gap-3 rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-3">
          {/* Selected chip */}
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "mt-0.5 shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                katCfg(selected.kategori).bg,
                katCfg(selected.kategori).text,
                katCfg(selected.kategori).ring,
              )}
            >
              {katCfg(selected.kategori).icon}
              {selected.kategori}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800">
                {selected.nama}
              </p>
              <p className="font-mono text-[10px] text-slate-400">
                {selected.kode}
              </p>
            </div>
          </div>

          {/* Jumlah stepper */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Jumlah
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setJumlah((j) => Math.max(1, j - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
              >
                <Minus size={12} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-slate-800">
                {jumlah}
              </span>
              <button
                onClick={() => setJumlah((j) => j + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
              >
                <Plus size={12} />
              </button>
              <span className="text-xs text-slate-500">kali</span>
            </div>
          </div>

          {/* Pelaksana */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Dilakukan Oleh
            </label>
            <div className="relative">
              <Stethoscope
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={pelaksana}
                onChange={(e) => setPelaksana(e.target.value)}
                placeholder="dr. / Perawat..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-xs text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleAdd}
            disabled={alreadyAdded}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors",
              alreadyAdded
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700",
            )}
          >
            <Plus size={13} />
            Tambah Tindakan
          </button>

          {alreadyAdded && (
            <p className="text-center text-[10px] text-rose-500">
              Tindakan ini sudah ditambahkan
            </p>
          )}
        </div>
      )}

      {!selected && (
        <p className="text-center text-[11px] text-slate-400 pt-1">
          Ketik nama atau kode untuk mencari tindakan
        </p>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function TindakanTab({
  patient,
}: {
  patient: IGDPatientDetail;
}) {
  const [items, setItems] = useState<LocalTindakan[]>(() =>
    patient.tindakan.map((t) => ({
      ...t,
      kategori: KODE_TO_ENTRY.get(t.kode)?.kategori,
    })),
  );

  const existingKodes = new Set(items.map((i) => i.kode));

  function addTindakan(
    entry: TindakanEntry,
    jumlah: number,
    pelaksana: string,
  ) {
    if (existingKodes.has(entry.kode)) return;
    const now = new Date();
    const waktu = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setItems((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        nama: entry.nama,
        kode: entry.kode,
        waktu,
        dilakukanOleh: pelaksana,
        jumlah,
        kategori: entry.kategori,
      },
    ]);
  }

  function removeTindakan(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function changeJumlah(id: string, n: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, jumlah: n } : i)),
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
      {/* ── Left: list ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-indigo-500" />
            <span className="text-xs font-semibold text-slate-700">
              Daftar Tindakan
            </span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
              {items.length}
            </span>
          </div>
          {items.length > 0 && (
            <span className="text-[11px] text-slate-400">
              Total: {items.reduce((s, i) => s + i.jumlah, 0)}×
            </span>
          )}
        </div>

        {/* List card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {items.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Belum ada tindakan yang dicatat
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <TindakanRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeTindakan(item.id)}
                  onChangeJumlah={(n) => changeJumlah(item.id, n)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Right: search & add ─────────────────────────── */}
      <div className="w-full shrink-0 lg:w-80 xl:w-96">
        <div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Search size={13} className="text-indigo-500" />
            <span className="text-xs font-semibold text-slate-700">
              Tambah Tindakan
            </span>
          </div>
          <SearchPanel onAdd={addTindakan} existingKodes={existingKodes} />
        </div>
      </div>
    </div>
  );
}
