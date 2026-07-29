"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Package, AlertCircle, Loader2 } from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { listPaketLayananTersedia, type PaketDTO } from "@/lib/api/master/paketLayanan";
import { setKunjunganPaket } from "@/lib/api/kunjungan";
import { type PaketLayananData, fmtRp } from "./paketTypes";
import PaketConfirmDialog, { type PaketConfirmMode } from "./PaketConfirmDialog";

// Pasien DB (UUID) → persist ke kunjungan.paketLayananId; demo (non-UUID) → pilihan lokal saja.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Adapter ──────────────────────────────────────────────────

/** master.PaketLayanan (DTO) → kartu paket. `layanan` diturunkan dari item bundel snapshot. */
function dtoToPaket(d: PaketDTO): PaketLayananData {
  return {
    id: d.id,
    nama: d.nama,
    kategori: d.kategori,
    deskripsi: d.deskripsi,
    layanan: d.items.map((i) => (i.qty > 1 ? `${i.nama} ×${i.qty}` : i.nama)),
    harga: d.hargaUmum,
    badge: (d.badge ?? undefined) as PaketLayananData["badge"],
    aktif: d.status === "Aktif",
  };
}

// ─── Constants ────────────────────────────────────────────────

const BADGE_STYLE: Record<string, string> = {
  Populer: "bg-sky-100 text-sky-700",
  Baru:    "bg-emerald-100 text-emerald-700",
  Promo:   "bg-amber-100 text-amber-700",
};

const BADGE_PREFIX: Record<string, string> = {
  Populer: "★ ",
  Baru:    "✦ ",
  Promo:   "⚡ ",
};

// ─── EmptyState ───────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Package size={20} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-slate-500">
          Tidak ada paket{label !== "Semua" ? ` kategori ${label}` : ""}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Atur ketersediaan paket di Master → Paket Layanan
        </p>
      </div>
    </motion.div>
  );
}

// ─── PackageCard ──────────────────────────────────────────────

function PackageCard({
  paket, isActive, busy, disabled, onToggle, delay,
}: {
  paket: PaketLayananData;
  isActive: boolean;
  busy: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border-2 transition",
        isActive
          ? "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100/60"
          : "border-slate-200 bg-white hover:shadow-sm",
      )}
    >
      {/* Active accent top bar */}
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-400" />
      )}

      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={cn("text-[13px] font-bold", isActive ? "text-emerald-800" : "text-slate-800")}>{paket.nama}</p>
            {isActive && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                <Check size={9} /> Terpilih
              </span>
            )}
            {paket.badge && !isActive && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[8.5px] font-bold", BADGE_STYLE[paket.badge])}>
                {BADGE_PREFIX[paket.badge]}{paket.badge}
              </span>
            )}
          </div>
          <p className="text-[10.5px] leading-snug text-slate-500">{paket.deskripsi}</p>
        </div>

        {/* Service list */}
        <ul className="space-y-1">
          {paket.layanan.map((l) => (
            <li key={l} className="flex items-start gap-1.5">
              <Check size={10} className={cn("mt-0.5 shrink-0", isActive ? "text-emerald-500" : "text-sky-500")} />
              <span className="text-[10.5px] leading-snug text-slate-600">{l}</span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className={cn("text-[14px] font-bold", isActive ? "text-emerald-700" : "text-slate-800")}>{fmtRp(paket.harga)}</p>
            <p className="text-[9px] text-slate-400">masuk tagihan</p>
          </div>
          {busy ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
              <Loader2 size={11} className="animate-spin" /> Menyimpan…
            </span>
          ) : isActive ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle(paket.id)}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40 active:scale-95"
            >
              Lepas Paket
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle(paket.id)}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-sky-700 disabled:opacity-40 active:scale-95"
            >
              Pilih Paket
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── PaketLayanan ─────────────────────────────────────────────

export function PaketLayanan({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const persist = UUID_RE.test(kunjungan.id); // pasien DB → simpan; demo → lokal

  const [pakets,     setPakets]     = useState<PaketLayananData[] | null>(null); // null = memuat
  const [loadErr,    setLoadErr]    = useState(false);
  const [kategori,   setKategori]   = useState<string>("Semua");
  const [selectedId, setSelectedId] = useState<string | null>(kunjungan.paketLayananId ?? null);
  const [busyId,     setBusyId]     = useState<string | null>(null);
  const [err,        setErr]        = useState<string | null>(null);
  // Aksi tertunda menunggu konfirmasi (pilih / lepas paket).
  const [pending, setPending] = useState<{ paket: PaketLayananData; mode: PaketConfirmMode; next: string | null } | null>(null);

  // Paket dari master DB (status Aktif). Bila paket terpilih kunjungan sudah non-aktif, ia tak
  // muncul di daftar — banner ringkasan tetap menandainya via selectedId (lihat di bawah).
  useEffect(() => {
    const ac = new AbortController();
    listPaketLayananTersedia(ac.signal)
      .then((rows) => setPakets(rows.map(dtoToPaket)))
      .catch(() => { if (!ac.signal.aborted) { setPakets([]); setLoadErr(true); } });
    return () => ac.abort();
  }, []);

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set((pakets ?? []).map((p) => p.kategori)))],
    [pakets],
  );
  const list         = pakets ?? [];
  const filtered     = list.filter((p) => kategori === "Semua" || p.kategori === kategori);
  const selectedPaket = list.find((p) => p.id === selectedId) ?? null;

  // Klik Pilih/Lepas → buka dialog konfirmasi (aksi ditunda sampai dikonfirmasi).
  const requestToggle = (id: string) => {
    if (busyId) return;
    const paket = list.find((p) => p.id === id);
    if (!paket) return;
    const next: string | null = selectedId === id ? null : id; // klik paket terpilih = lepas
    setErr(null);
    setPending({ paket, mode: next === null ? "release" : "pick", next });
  };

  // Konfirmasi → persist ke kunjungan (billing reaktif via recordBus "order").
  const confirmToggle = async () => {
    if (!pending) return;
    const { paket, next } = pending;
    if (!persist) { setSelectedId(next); setPending(null); return; } // demo lokal
    setBusyId(paket.id); setErr(null);
    try {
      await setKunjunganPaket(kunjungan.id, next);
      setSelectedId(next);
      setPending(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan paket.");
      setPending(null);
    } finally {
      setBusyId(null);
    }
  };

  // Loading skeleton (fetch awal).
  if (pakets === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-400">
        <Loader2 size={22} className="animate-spin text-sky-500" />
        <p className="text-[12px] font-medium">Memuat paket layanan…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {err && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100">
          <AlertCircle size={13} className="shrink-0" /> {err}
        </div>
      )}
      {loadErr && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
          <AlertCircle size={13} className="shrink-0" /> Gagal memuat paket dari master. Coba muat ulang halaman.
        </div>
      )}
      {!persist && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
          <AlertCircle size={13} className="shrink-0" /> Pasien demo — pilihan paket tidak tersimpan ke tagihan.
        </div>
      )}

      {/* Ringkasan paket aktif — background hijau */}
      {selectedPaket && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <Check size={15} className="text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-emerald-800">{selectedPaket.nama} — paket aktif</p>
            <p className="text-[10.5px] text-emerald-600">
              {fmtRp(selectedPaket.harga)} otomatis masuk tagihan (rekam medis &amp; ehis-billing).
            </p>
          </div>
          <button
            type="button"
            disabled={!!busyId}
            onClick={() => requestToggle(selectedPaket.id)}
            className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
          >
            Lepas
          </button>
        </div>
      )}

      {/* Category filter — dinamis dari kategori yang ada di master */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKategori(k)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 active:scale-95",
              kategori === k
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Package grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <EmptyState key="empty" label={kategori} />
        ) : (
          <motion.div
            key={kategori}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            {filtered.map((paket, i) => (
              <PackageCard
                key={paket.id}
                paket={paket}
                isActive={paket.id === selectedId}
                busy={busyId === paket.id}
                disabled={!!busyId}
                onToggle={requestToggle}
                delay={i * 0.04}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Konfirmasi pilih / lepas paket */}
      <PaketConfirmDialog
        open={pending !== null}
        mode={pending?.mode ?? "pick"}
        paket={pending?.paket ?? null}
        replacing={
          pending?.mode === "pick" && selectedPaket && selectedPaket.id !== pending.paket.id
            ? selectedPaket
            : null
        }
        busy={!!busyId}
        onConfirm={confirmToggle}
        onCancel={() => { if (!busyId) setPending(null); }}
      />
    </div>
  );
}
