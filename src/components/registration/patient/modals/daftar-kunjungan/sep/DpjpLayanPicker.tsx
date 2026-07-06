"use client";

// Picker DPJP Pelayanan (SEP Rawat Jalan) — ketik NAMA dokter → tarik nama + kode DPJP BPJS.
// Payload HANYA menyimpan KODE (dpjpLayan = kodeDPJP), sesuai spec V-Claim. Sumber = dokter RS
// ter-map BPJS (/bpjs/dpjp-tersedia, gate loket). Hanya dokter ber-kode yang dapat dipilih.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, X, Loader2, ChevronDown, BadgeCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { listDpjpTersediaLoket, type DpjpTersediaDTO } from "@/lib/api/master/dpjpTersedia";
import { fieldInput } from "./sepFormShared";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

export function DpjpLayanPicker({
  value, onChange,
}: {
  value: string; // kode DPJP BPJS (yang masuk payload)
  onChange: (kode: string) => void;
}) {
  const [list, setList] = useState<DpjpTersediaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    listDpjpTersediaLoket(ac.signal)
      .then((rows) => { if (!cancelled) setList(rows); })
      .catch((e) => { if (!cancelled && !isAbort(e)) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; ac.abort(); };
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = useMemo(() => list.find((d) => d.kodeBpjs && d.kodeBpjs === value) ?? null, [list, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withCode = list.filter((d) => d.kodeBpjs); // payload butuh kode → sembunyikan yang belum di-map
    if (!q) return withCode.slice(0, 8);
    return withCode
      .filter((d) => d.nama.toLowerCase().includes(q) || (d.kodeBpjs ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [list, query]);

  const pick = (d: DpjpTersediaDTO) => {
    onChange(d.kodeBpjs ?? "");
    setQuery("");
    setOpen(false);
  };

  // Nilai terpilih → chip (nama + kode). Payload = kode.
  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/60 px-3 py-2">
        <BadgeCheck size={14} className="shrink-0 text-emerald-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-slate-700">{selected ? selected.nama : "DPJP terpilih"}</p>
          <p className="font-mono text-[10px] text-emerald-700">Kode DPJP: {value}</p>
        </div>
        <button type="button" onClick={() => onChange("")} aria-label="Ganti DPJP"
          className="shrink-0 text-slate-400 transition hover:text-slate-600">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Stethoscope size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Ketik nama dokter DPJP…"
        className={cn(fieldInput, "pl-8 pr-8")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? <Loader2 size={12} className="animate-spin text-slate-300" /> : <ChevronDown size={12} className="text-slate-300" />}
      </span>

      <AnimatePresence>
        {open && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {error ? (
              <div className="px-3 py-3 text-center text-[11px] text-rose-500">Gagal memuat daftar dokter.</div>
            ) : filtered.length > 0 ? (
              <ul className="max-h-56 overflow-y-auto">
                {filtered.map((d) => (
                  <li key={d.dokterId}>
                    <button type="button" onMouseDown={() => pick(d)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-emerald-50">
                      <Stethoscope size={12} className="shrink-0 text-emerald-500" />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-700">{d.nama}</span>
                      <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-700">{d.kodeBpjs}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                <UserX size={16} className="text-slate-300" />
                <p className="text-[11px] text-slate-400">
                  {query.trim() ? `Tidak ada dokter cocok "${query.trim()}"` : "Belum ada dokter ter-map kode DPJP BPJS"}
                </p>
                <p className="text-[9.5px] text-slate-300">Atur di Mapping Hub → DPJP BPJS</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
