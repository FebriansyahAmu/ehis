"use client";

// Tindakan IGD — redesign 2026-06-12 (selaras pola DiagnosaTab: search-first + kartu konfigurasi +
// daftar tergrup + sidebar ringkasan). Katalog = TINDAKAN TER-ASSIGN dari Mapping Hub → Layanan Unit
// (GET /master/tindakan-tersedia, gate clinical.tindakan). Lab & Radiologi TIDAK termuat — keduanya
// punya menu Order tersendiri. Pelaksana default = petugas sesi login. Recording = state lokal
// (belum ada endpoint persist; detail IGD masih mock).

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Plus, Minus, Trash2, Stethoscope, Activity, Syringe, Wrench, Zap,
  Loader2, CheckCircle2, ClipboardList, Info, Sparkles, ServerCog, Wallet, AlertTriangle,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { listTindakanTersedia, type TindakanTersediaDTO } from "@/lib/api/master/tindakanTersedia";
import {
  getTindakanMedis, addTindakanMedis, updateTindakanMedis, deleteTindakanMedis,
  type TindakanMedisDTO,
} from "@/lib/api/tindakanMedis/tindakanMedis";
import type { TindakanKategoriDTO } from "@/lib/schemas/master/tindakan";
import { toast } from "@/lib/ui/toastStore";

// Konteks tarif IGD: penjamin UMUM (Tarif PERDA berlaku semua jaminan) · tier ruangan IGD.
const TARIF_PENJAMIN_KODE = "UMUM";
const TARIF_JENIS_RUANGAN = "IGD";

// kunjunganId UUID → mode DB (persist ke medicalrecord.TindakanMedis); selain itu lokal (mock).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RP = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const fmtRp = (n: number) => RP.format(n);

// ── Kategori tampilan (IGD memetakan 16 enum master → 3 grup operasional) ──────
type DisplayKat = "Diagnostik" | "Terapi" | "Prosedur";

const KAT_MAP: Record<TindakanKategoriDTO, DisplayKat> = {
  Konsultasi: "Diagnostik", Diagnostik: "Diagnostik", Pediatrik: "Diagnostik", Spesialistik: "Diagnostik",
  Resusitasi: "Terapi", Anestesi: "Terapi", Keperawatan: "Terapi",
  Tindakan_Medis: "Prosedur", Bedah_Minor: "Prosedur", Bedah_Mayor: "Prosedur", Bedah_Khusus: "Prosedur",
  Obstetri: "Prosedur", Prosedur_Bedah: "Prosedur", Prosedur_Non_Bedah: "Prosedur",
  Tindakan_Invasif: "Prosedur", Non_Kategori: "Prosedur",
};

const KAT_ORDER: DisplayKat[] = ["Diagnostik", "Terapi", "Prosedur"];

interface KatCfg {
  icon: React.ReactNode; dot: string; text: string; bg: string; ring: string; border: string;
}
const KAT_CFG: Record<DisplayKat, KatCfg> = {
  Diagnostik: { icon: <Activity size={11} />, dot: "bg-sky-500",     text: "text-sky-700",     bg: "bg-sky-50",     ring: "ring-sky-200",     border: "border-l-sky-400" },
  Terapi:     { icon: <Syringe size={11} />,  dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", border: "border-l-emerald-400" },
  Prosedur:   { icon: <Wrench size={11} />,   dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200",   border: "border-l-amber-400" },
};
const KAT_DEFAULT: KatCfg = { icon: <Zap size={11} />, dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", ring: "ring-slate-200", border: "border-l-slate-300" };
const katCfg = (k?: DisplayKat): KatCfg => (k ? KAT_CFG[k] : KAT_DEFAULT);

// ── Types lokal ───────────────────────────────────────────
interface CatalogEntry {
  id: string;
  kode: string;
  nama: string;
  kategori: DisplayKat;
  /** Kategori master asli (utk snapshot saat persist). */
  masterKategori: TindakanKategoriDTO;
  kompleksitas: string | null;
  harga: number | null;
  searchText: string;
}
interface LocalTindakan {
  id: string;
  tindakanId?: string;
  kode: string;
  nama: string;
  kategori?: DisplayKat;
  harga: number | null;
  jumlah: number;
  waktu: string;
  dilakukanOleh: string;
}

function nowHHMM() {
  const n = new Date();
  return `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
}

// ── Search (search-first, dropdown tergrup) ───────────────

function TindakanSearch({
  catalog, existingIds, onSelect,
}: {
  catalog: CatalogEntry[];
  existingIds: Set<string>;
  onSelect: (e: CatalogEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function key(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", key); };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q.length < 1 ? [] : catalog.filter((e) => e.searchText.includes(q)).slice(0, 40)),
    [q, catalog],
  );
  const grouped = useMemo(() => {
    const m = new Map<DisplayKat, CatalogEntry[]>();
    for (const e of filtered) (m.get(e.kategori) ?? m.set(e.kategori, []).get(e.kategori)!).push(e);
    return m;
  }, [filtered]);

  function pick(e: CatalogEntry) {
    if (existingIds.has(e.id)) return;
    onSelect(e);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) pick(filtered[0]); }}
          placeholder="Cari tindakan — nama, kode, atau kategori…"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs text-slate-800 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            aria-label="Bersihkan pencarian"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && q.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada tindakan cocok</p>
            ) : (
              KAT_ORDER.filter((k) => grouped.has(k)).map((kat) => {
                const cfg = KAT_CFG[kat];
                return (
                  <div key={kat}>
                    <div className={cn("flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wide", cfg.text)}>
                      {cfg.icon}{kat}
                    </div>
                    {grouped.get(kat)!.map((e) => {
                      const added = existingIds.has(e.id);
                      return (
                        <button
                          key={e.id}
                          disabled={added}
                          onClick={() => pick(e)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left transition",
                            added ? "cursor-default opacity-40" : "hover:bg-indigo-50",
                          )}
                        >
                          {e.kode ? (
                            <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-slate-400">{e.kode}</span>
                          ) : (
                            <span className="w-14 shrink-0 text-[9px] italic text-slate-300">tanpa kode</span>
                          )}
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{e.nama}</span>
                          {added && <span className="shrink-0 text-[10px] text-slate-400">sudah ada</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Kartu konfigurasi (jumlah + pelaksana) ────────────────

function ConfigCard({
  entry, defaultPelaksana, onAdd, onCancel,
}: {
  entry: CatalogEntry;
  defaultPelaksana: string;
  onAdd: (jumlah: number, pelaksana: string) => void;
  onCancel: () => void;
}) {
  const [jumlah, setJumlah] = useState(1);
  const [pelaksana, setPelaksana] = useState(defaultPelaksana);
  const cfg = katCfg(entry.kategori);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-md"
    >
      {/* head */}
      <div className="flex items-start gap-2.5 border-b border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5">
        <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1", cfg.bg, cfg.text, cfg.ring)}>
          {cfg.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1", cfg.bg, cfg.text, cfg.ring)}>
              {entry.kategori}
            </span>
            {entry.kode && <span className="font-mono text-[10px] font-bold text-slate-400">{entry.kode}</span>}
            {entry.kompleksitas && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">{entry.kompleksitas}</span>
            )}
            {entry.harga != null ? (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">{fmtRp(entry.harga)}</span>
            ) : (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 ring-1 ring-amber-200">Belum bertarif</span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-800">{entry.nama}</p>
        </div>
        <button
          onClick={onCancel}
          aria-label="Batal"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-indigo-300 transition hover:bg-indigo-100 hover:text-indigo-600"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3.5">
        <div className="flex items-end gap-4">
          {/* jumlah */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Jumlah</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setJumlah((j) => Math.max(1, j - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                <Minus size={12} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-slate-800">{jumlah}</span>
              <button
                onClick={() => setJumlah((j) => j + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                <Plus size={12} />
              </button>
              <span className="ml-1 text-xs text-slate-400">kali</span>
            </div>
          </div>
          {/* pelaksana */}
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Dilakukan Oleh</p>
            <div className="relative">
              <Stethoscope size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pelaksana}
                onChange={(e) => setPelaksana(e.target.value)}
                placeholder="Nama pelaksana…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {entry.harga != null && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Subtotal</span>
            <span className="text-sm font-bold tabular-nums text-emerald-700">{fmtRp(entry.harga * jumlah)}</span>
          </div>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={() => onAdd(jumlah, pelaksana.trim())}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            <CheckCircle2 size={12} /> Tambah Tindakan
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Baris tindakan tercatat ───────────────────────────────

function TindakanRow({
  item, onRemove, onChangeJumlah,
}: {
  item: LocalTindakan;
  onRemove: () => void;
  onChangeJumlah: (n: number) => void;
}) {
  const cfg = katCfg(item.kategori);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18 }}
      className={cn("group flex items-center gap-2.5 border-b border-l-2 border-slate-100 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-slate-50/70", cfg.border)}
    >
      <span className={cn("hidden shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 sm:flex", cfg.bg, cfg.text, cfg.ring)}>
        {cfg.icon}<span className="hidden md:inline">{item.kategori ?? "—"}</span>
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">{item.nama}</p>
        <p className="truncate font-mono text-[10px] text-slate-400">
          {item.kode || "—"}
          {item.dilakukanOleh ? ` · ${item.dilakukanOleh}` : ""}
          {item.waktu ? ` · ${item.waktu}` : ""}
        </p>
        {item.harga != null ? (
          <p className="text-[10px] font-medium text-emerald-600">@ {fmtRp(item.harga)}</p>
        ) : (
          <p className="text-[10px] font-medium text-amber-500">Belum bertarif</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onChangeJumlah(Math.max(1, item.jumlah - 1))}
          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          <Minus size={9} />
        </button>
        <span className="w-5 text-center text-xs font-bold text-slate-800">{item.jumlah}</span>
        <button
          onClick={() => onChangeJumlah(item.jumlah + 1)}
          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          <Plus size={9} />
        </button>
      </div>

      {/* Subtotal per baris (harga × jumlah) */}
      <div className="hidden w-24 shrink-0 text-right sm:block">
        {item.harga != null ? (
          <span className="text-xs font-bold tabular-nums text-emerald-700">{fmtRp(item.harga * item.jumlah)}</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </div>

      <button
        onClick={onRemove}
        aria-label="Hapus tindakan"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-rose-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={12} />
      </button>
    </motion.li>
  );
}

// ── Sidebar ringkasan ─────────────────────────────────────

function RingkasanPanel({ items }: { items: LocalTindakan[] }) {
  const total = items.length;
  const totalQty = items.reduce((s, i) => s + i.jumlah, 0);
  const grandTotal = items.reduce((s, i) => s + (i.harga ?? 0) * i.jumlah, 0);
  const untariffed = items.filter((i) => i.harga == null).length;
  const counts = KAT_ORDER
    .map((k) => ({ kat: k, n: items.filter((i) => i.kategori === k).length }))
    .filter((c) => c.n > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:sticky lg:top-4">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <ClipboardList size={12} className="text-indigo-400" />
        <p className="text-xs font-bold text-slate-700">Ringkasan Tindakan</p>
      </div>

      {/* ── Estimasi biaya (hero, animasi tiap berubah) ── */}
      <div className="border-b border-slate-100 bg-linear-to-br from-emerald-50 via-emerald-50/40 to-white px-3.5 py-3">
        <div className="flex items-center gap-1.5">
          <Wallet size={12} className="text-emerald-500" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Estimasi Biaya Tindakan</p>
        </div>
        <div className="mt-1 h-8 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={grandTotal}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="text-2xl font-black tabular-nums tracking-tight text-emerald-700"
            >
              {fmtRp(grandTotal)}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-0.5 text-[9px] text-slate-400">
          {total} tindakan · {totalQty}× · tarif IGD (Umum / PERDA)
        </p>
        {untariffed > 0 && (
          <div className="mt-1.5 flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
            <AlertTriangle size={10} className="shrink-0" />
            {untariffed} tindakan belum bertarif (belum dihitung)
          </div>
        )}
      </div>

      {/* total */}
      <div className="grid grid-cols-2 gap-2 px-3.5 py-3">
        <div className="rounded-lg bg-indigo-50 px-3 py-2 ring-1 ring-indigo-100">
          <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Jenis</p>
          <p className="text-lg font-bold leading-tight text-indigo-700">{total}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Qty</p>
          <p className="text-lg font-bold leading-tight text-slate-700">{totalQty}×</p>
        </div>
      </div>

      {counts.length > 0 && (
        <div className="border-t border-slate-100 px-3.5 py-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Komposisi Kategori</p>
          <div className="flex flex-col gap-1.5">
            {counts.map(({ kat, n }) => {
              const cfg = KAT_CFG[kat];
              const pct = Math.round((n / total) * 100);
              return (
                <div key={kat} className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
                  <span className="w-20 shrink-0 text-[10px] text-slate-500">{kat}</span>
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={cn("h-full rounded-full", cfg.dot)}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-right text-[10px] font-semibold text-slate-600">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 bg-indigo-50/50 px-3.5 py-3">
        <div className="flex items-start gap-2">
          <Info size={11} className="mt-0.5 shrink-0 text-indigo-400" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Hilir Data</p>
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-indigo-700">
              Tindakan tercatat dikonsumsi Billing &amp; Resume Medis.
            </p>
            <p className="mt-1 text-[9px] leading-snug text-indigo-400">
              Lab &amp; Radiologi dicatat via menu Order tersendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function TindakanTab({ patient }: { patient: IGDPatientDetail }) {
  const { session } = useSession();
  const defaultPelaksana = session?.namaTampil ?? "";

  // kunjunganId UUID → persist ke DB (medicalrecord.TindakanMedis); selain itu lokal (demo mock).
  const isPersisted = UUID_RE.test(patient.id);
  const kunjunganId = patient.id;

  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);

  // Katalog by kode → enrich kategori baris seed (mock).
  const catalogByKode = useMemo(() => {
    const m = new Map<string, CatalogEntry>();
    for (const e of catalog) if (e.kode) m.set(e.kode, e);
    return m;
  }, [catalog]);

  const [items, setItems] = useState<LocalTindakan[]>(() =>
    isPersisted
      ? [] // mode DB → dimuat dari getTindakanMedis saat mount
      : patient.tindakan.map((t) => ({
          id: t.id, kode: t.kode, nama: t.nama, jumlah: t.jumlah,
          waktu: t.waktu, dilakukanOleh: t.dilakukanOleh, harga: null,
        })),
  );

  // Resolve kategori + harga baris seed dari katalog (by kode) bila belum ter-set.
  const resolvedItems = useMemo(
    () => items.map((it) => {
      const ref = catalogByKode.get(it.kode);
      return {
        ...it,
        kategori: it.kategori ?? ref?.kategori,
        harga: it.harga ?? ref?.harga ?? null,
      };
    }),
    [items, catalogByKode],
  );

  const existingIds = useMemo(
    () => new Set(items.map((i) => i.tindakanId).filter((x): x is string => !!x)),
    [items],
  );

  // Muat katalog ter-assign sekali saat mount.
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setCatalogError(null);
    (async () => {
      try {
        const dtos = await listTindakanTersedia(
          { penjaminKode: TARIF_PENJAMIN_KODE, jenisRuangan: TARIF_JENIS_RUANGAN },
          ac.signal,
        );
        setCatalog(dtos.map(toCatalogEntry));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setCatalogError("Gagal memuat katalog tindakan ter-assign");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Mode DB → muat tindakan tersimpan saat mount.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getTindakanMedis(kunjunganId, ac.signal)
      .then((dtos) => setItems(dtos.map(dtoToLocal)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat tindakan tersimpan");
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const reload = useCallback(async () => {
    if (!isPersisted) return;
    try {
      setItems((await getTindakanMedis(kunjunganId)).map(dtoToLocal));
    } catch {
      /* pertahankan state terakhir */
    }
  }, [isPersisted, kunjunganId]);

  const addTindakan = useCallback((entry: CatalogEntry, jumlah: number, pelaksana: string) => {
    setSelected(null);

    if (isPersisted) {
      setBusy(true);
      addTindakanMedis(kunjunganId, {
        tindakanId: entry.id,
        kode: entry.kode || undefined,
        nama: entry.nama,
        kategori: entry.masterKategori,
        jumlah,
        harga: entry.harga ?? undefined,
        penjaminKode: TARIF_PENJAMIN_KODE,
        jenisRuangan: TARIF_JENIS_RUANGAN,
        pelaksana: pelaksana || undefined,
      })
        .then((dto) => setItems((prev) => [...prev, dtoToLocal(dto)]))
        .catch(() => toast.error("Gagal menyimpan tindakan"))
        .finally(() => setBusy(false));
      return;
    }

    setItems((prev) => {
      if (prev.some((i) => i.tindakanId === entry.id)) return prev;
      return [
        ...prev,
        {
          id: `t-${Date.now()}`,
          tindakanId: entry.id,
          kode: entry.kode,
          nama: entry.nama,
          kategori: entry.kategori,
          harga: entry.harga,
          jumlah,
          waktu: nowHHMM(),
          dilakukanOleh: pelaksana || "—",
        },
      ];
    });
  }, [isPersisted, kunjunganId]);

  const removeTindakan = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id)); // optimistik
    if (isPersisted) {
      deleteTindakanMedis(kunjunganId, id).catch(() => { toast.error("Gagal menghapus tindakan"); void reload(); });
    }
  }, [isPersisted, kunjunganId, reload]);

  const changeJumlah = useCallback((id: string, n: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, jumlah: n } : i))); // optimistik
    if (isPersisted) {
      updateTindakanMedis(kunjunganId, id, { jumlah: n }).catch(() => { toast.error("Gagal mengubah jumlah"); void reload(); });
    }
  }, [isPersisted, kunjunganId, reload]);

  const grouped = useMemo(() => {
    const m = new Map<DisplayKat | "_", LocalTindakan[]>();
    for (const it of resolvedItems) {
      const k = (it.kategori ?? "_") as DisplayKat | "_";
      (m.get(k) ?? m.set(k, []).get(k)!).push(it);
    }
    return m;
  }, [resolvedItems]);

  const totalQty = resolvedItems.reduce((s, i) => s + i.jumlah, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Zap size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Tindakan IGD</p>
          <p className="text-[10px] text-slate-400">
            Prosedur &amp; tindakan medis — dari katalog ter-assign unit (Lab &amp; Radiologi via menu Order)
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {busy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-200">
              <Loader2 size={10} className="animate-spin" /> Menyimpan…
            </span>
          )}
          {loading && !busy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
              <Loader2 size={10} className="animate-spin" /> Memuat katalog…
            </span>
          )}
          {resolvedItems.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
              {resolvedItems.length} tindakan · {totalQty}×
            </span>
          )}
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        {/* Kiri: add + list */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Add flow (search-first / config card) */}
          {catalogError ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
              <ServerCog size={13} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-[11px] leading-snug text-rose-700">
                {catalogError}. Pastikan Anda login &amp; punya hak <span className="font-mono">clinical.tindakan</span>.
              </p>
            </div>
          ) : !loading && catalog.length === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3.5 py-2.5">
              <Info size={13} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] leading-snug text-amber-700">
                <strong>Belum ada tindakan ter-assign.</strong> Hubungi admin master untuk memetakan
                tindakan ke ruangan via <em>Mapping Hub → Layanan Unit</em>.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <ConfigCard
                  key="cfg"
                  entry={selected}
                  defaultPelaksana={defaultPelaksana}
                  onAdd={(j, p) => addTindakan(selected, j, p)}
                  onCancel={() => setSelected(null)}
                />
              ) : (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <TindakanSearch catalog={catalog} existingIds={existingIds} onSelect={setSelected} />
                  <p className="mt-1.5 px-1 text-[10px] text-slate-400">
                    {loading ? "Memuat katalog tindakan ter-assign…" : `${catalog.length} tindakan tersedia di katalog unit`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Daftar tindakan tercatat */}
          {resolvedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
                <Zap size={20} className="text-indigo-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Belum ada tindakan dicatat</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Cari di kotak pencarian untuk menambah tindakan dari katalog unit
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {KAT_ORDER.map((kat) => {
                const list = grouped.get(kat) ?? [];
                if (list.length === 0) return null;
                const cfg = KAT_CFG[kat];
                return (
                  <div key={kat} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className={cn("flex items-center gap-1.5 border-b border-slate-100 px-3 py-1.5", cfg.bg)}>
                      <span className={cn("flex items-center gap-1", cfg.text)}>{cfg.icon}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.text)}>{kat}</span>
                      <span className={cn("text-[10px] opacity-70", cfg.text)}>· {list.length}</span>
                    </div>
                    <ul>
                      <AnimatePresence initial={false}>
                        {list.map((item) => (
                          <TindakanRow
                            key={item.id}
                            item={item}
                            onRemove={() => removeTindakan(item.id)}
                            onChangeJumlah={(n) => changeJumlah(item.id, n)}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                );
              })}
              {/* Tanpa kategori (seed mock tak match katalog) */}
              {(grouped.get("_") ?? []).length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-100 px-3 py-1.5">
                    <Sparkles size={11} className="text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Lainnya</span>
                    <span className="text-[10px] text-slate-400">· {(grouped.get("_") ?? []).length}</span>
                  </div>
                  <ul>
                    <AnimatePresence initial={false}>
                      {(grouped.get("_") ?? []).map((item) => (
                        <TindakanRow
                          key={item.id}
                          item={item}
                          onRemove={() => removeTindakan(item.id)}
                          onChangeJumlah={(n) => changeJumlah(item.id, n)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kanan: ringkasan */}
        <div className="w-full shrink-0 lg:w-80">
          <RingkasanPanel items={resolvedItems} />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

function toCatalogEntry(d: TindakanTersediaDTO): CatalogEntry {
  const kategori = KAT_MAP[d.kategori] ?? "Prosedur";
  return {
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    kategori,
    masterKategori: d.kategori,
    kompleksitas: d.kompleksitas,
    harga: d.harga,
    searchText: `${d.nama} ${d.kode} ${kategori}`.toLowerCase(),
  };
}

function pad2(n: number) { return n.toString().padStart(2, "0"); }

function dtoToLocal(d: TindakanMedisDTO): LocalTindakan {
  const t = new Date(d.dilakukanPada);
  return {
    id: d.id,
    tindakanId: d.tindakanId ?? undefined,
    kode: d.kode,
    nama: d.nama,
    kategori: KAT_MAP[d.kategori as TindakanKategoriDTO],
    harga: d.harga,
    jumlah: d.jumlah,
    waktu: `${pad2(t.getHours())}:${pad2(t.getMinutes())}`,
    dilakukanOleh: d.pelaksana,
  };
}
