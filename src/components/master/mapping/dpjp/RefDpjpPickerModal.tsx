"use client";

// Pemilih kode DPJP BPJS untuk 1 dokter RS — bentuk TABEL. Pilih baris manual → tombol Petakan.
// Baris yang sudah dipakai dokter LAIN dinonaktifkan. Search referensi (saran by-nama).

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Search, Loader2, Stethoscope, CheckCircle2, Inbox, Link2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchRefDpjp, type RefDpjpOption } from "@/lib/api/bpjs/dpjpMapping";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

export function RefDpjpPickerModal({
  dokterId, dokterNama, currentKode, onSelect, onClose,
}: {
  dokterId: string;
  dokterNama: string;
  currentKode?: string | null;
  onSelect: (kode: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<RefDpjpOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(currentKode ?? null);

  // Esc untuk tutup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch (debounce search).
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      setError(false);
      searchRefDpjp({ search: search.trim() || undefined, limit: 100 }, ac.signal)
        .then((items) => { if (!cancelled) setRows(items); })
        .catch((e) => { if (!cancelled && !isAbort(e)) setError(true); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); ac.abort(); };
  }, [search]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aBusy = !!a.mappedDokterId && a.mappedDokterId !== dokterId;
      const bBusy = !!b.mappedDokterId && b.mappedDokterId !== dokterId;
      return Number(aBusy) - Number(bBusy);
    });
  }, [rows, dokterId]);

  const selectedRow = sorted.find((r) => r.kode === selected) ?? null;

  const body = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
              <Stethoscope size={19} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Pilih Kode DPJP BPJS</h2>
              <p className="text-[11px] text-slate-400">
                untuk <span className="font-semibold text-slate-600">{dokterNama}</span> — klik baris lalu tekan Petakan
              </p>
            </div>
          </div>
          <button
            onClick={onClose} aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / kode DPJP BPJS…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>

        {/* Tabel */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 size={16} className="animate-spin text-cyan-500" />
              <span className="text-[13px]">Memuat referensi…</span>
            </div>
          ) : error ? (
            <Empty title="Gagal memuat referensi" desc="Periksa koneksi lalu coba lagi." />
          ) : sorted.length === 0 ? (
            <Empty title="Tidak ada hasil" desc="Coba kata kunci lain, atau Sinkronkan Referensi BPJS dulu." />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2">Kode</th>
                  <th className="px-3 py-2">Nama Dokter</th>
                  <th className="px-3 py-2">Spesialis</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const isSel = r.kode === selected;
                  const isCurrent = !!currentKode && r.kode === currentKode;
                  const busy = !!r.mappedDokterId && r.mappedDokterId !== dokterId;
                  return (
                    <tr
                      key={r.kode}
                      onClick={() => { if (!busy) setSelected(r.kode); }}
                      aria-disabled={busy}
                      className={cn(
                        "border-b border-slate-100 transition",
                        busy
                          ? "cursor-not-allowed bg-slate-50/60 opacity-55"
                          : isSel
                            ? "cursor-pointer bg-cyan-50"
                            : "cursor-pointer hover:bg-slate-50",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        {isSel ? (
                          <CheckCircle2 size={16} className="text-cyan-600" />
                        ) : (
                          <Circle size={16} className={cn(busy ? "text-slate-200" : "text-slate-300")} />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-[13px] font-bold text-slate-800">{r.kode}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[12px] text-slate-700">{r.nama}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {r.kodeSpesialis ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{r.kodeSpesialis}</span>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {busy ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 ring-1 ring-amber-200">
                            <Link2 size={10} /> Dipakai dokter lain
                          </span>
                        ) : isCurrent ? (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-bold text-cyan-700">Terpetakan saat ini</span>
                        ) : (
                          <span className="text-[10px] text-slate-300">bebas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer: ringkasan + aksi */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="min-w-0 truncate text-[11px] text-slate-500">
            {selectedRow ? (
              <>
                Terpilih: <span className="font-mono font-bold text-slate-700">{selectedRow.kode}</span>
                <span className="text-slate-400"> · {selectedRow.nama}</span>
              </>
            ) : (
              "Pilih satu baris dari tabel."
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onSelect(selected)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Petakan
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(body, document.body);
}

function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <Inbox size={24} />
      </span>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="max-w-xs text-xs text-slate-400">{desc}</p>
    </div>
  );
}
