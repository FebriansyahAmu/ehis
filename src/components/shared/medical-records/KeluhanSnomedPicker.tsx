"use client";

// Picker KODE keluhan utama (SNOMED CT) — shared sub-menu Anamnesis IGD/RI/RJ (FHIR L03 · keputusan D4).
// Sumber = subset terkurasi master.asesmen_item kategori "KeluhanUtama" (GET /master/asesmen-tersedia,
// gate clinical.rekammedis:read). Teks bebas keluhan tetap di textarea (→ Condition `code.text`); picker
// hanya memilih KODE. Display yang tersimpan diturunkan SERVER dari master saat simpan (anti-spoof).
//
// Tidak wajib di form (dokter tak terblokir), tetapi tanpa kode Encounter tidak bisa `finished` di
// SatuSehat → hint amber. "Saran dari teks" = item yang namanya muncul di teks keluhan (1 klik).

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, BadgeCheck, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { listAsesmenTersedia, type AsesmenItemDTO } from "@/lib/api/master/asesmenKatalog";

export interface KeluhanSnomedValue {
  kode: string;
  display: string;
}

// Subset kecil (±50) dipakai 3 pane → cukup 1 fetch per muat halaman; gagal → boleh coba lagi.
let cache: Promise<AsesmenItemDTO[]> | null = null;
function loadKeluhan(): Promise<AsesmenItemDTO[]> {
  cache ??= listAsesmenTersedia({ kategori: "KeluhanUtama" }).catch((e: unknown) => {
    cache = null;
    throw e;
  });
  return cache;
}

const norm = (s: string | undefined) => (s ?? "").toLowerCase();

export default function KeluhanSnomedPicker({
  value, onChange, keluhanText, disabled = false,
}: {
  value: KeluhanSnomedValue | null;
  onChange: (v: KeluhanSnomedValue | null) => void;
  /** Teks keluhan utama saat ini — sumber "saran". */
  keluhanText: string;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<AsesmenItemDTO[] | null>(null);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const labelId = `${uid}-label`;
  const listId = `${uid}-list`;

  useEffect(() => {
    let alive = true;
    loadKeluhan()
      .then((rows) => { if (alive) { setItems(rows); setState("done"); } })
      .catch(() => { if (alive) setState("error"); });
    return () => { alive = false; };
  }, []);

  // Klik di luar → tutup daftar.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pool = useMemo(() => (items ?? []).filter((i) => !!i.snomedCode), [items]);
  const selected = value ? pool.find((i) => i.snomedCode === value.kode) : undefined;

  const results = useMemo(() => {
    const s = norm(q.trim());
    if (!s) return pool;
    return pool.filter((i) =>
      norm(i.nama).includes(s) || norm(i.snomedDisplay).includes(s)
      || norm(i.deskripsi).includes(s) || (i.snomedCode ?? "").startsWith(s));
  }, [pool, q]);

  // Item yang namanya muncul di teks keluhan; yang lebih spesifik (nama lebih panjang) dulu.
  const suggestions = useMemo(() => {
    const t = norm(keluhanText);
    if (value || !t.trim()) return [];
    return pool
      .filter((i) => t.includes(norm(i.nama)))
      .sort((a, b) => b.nama.length - a.nama.length)
      .slice(0, 4);
  }, [pool, keluhanText, value]);

  function pick(it: AsesmenItemDTO) {
    if (!it.snomedCode) return;
    onChange({ kode: it.snomedCode, display: it.snomedDisplay || it.nama });
    setQ("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <span id={labelId} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Kode Keluhan · SNOMED CT
        </span>
        {!value && (
          <span className="text-[10px] font-medium text-amber-600">
            Diperlukan agar kunjungan dapat dikirim selesai ke SatuSehat
          </span>
        )}
      </div>

      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
          <BadgeCheck size={14} className="shrink-0 text-cyan-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-cyan-800">{selected?.nama ?? value.display}</p>
            <p className="truncate font-mono text-[10px] text-cyan-600">SCT {value.kode} · {value.display}</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Hapus kode keluhan"
              className="rounded-md p-1 text-cyan-600 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <X size={13} />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="text"
            role="combobox"
            aria-labelledby={labelId}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
            disabled={disabled}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Cari keluhan: demam, nyeri dada, sesak…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 transition focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          {open && (
            <ul
              id={listId}
              role="listbox"
              aria-labelledby={labelId}
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              {state === "loading" ? (
                <li className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin text-cyan-500" aria-hidden /> Memuat katalog keluhan…
                </li>
              ) : state === "error" ? (
                <li className="flex items-center gap-2 px-3 py-3 text-xs text-rose-600">
                  <AlertCircle size={13} className="shrink-0" aria-hidden /> Gagal memuat katalog keluhan.
                </li>
              ) : results.length === 0 ? (
                <li className="px-3 py-3 text-xs leading-relaxed text-slate-500">
                  Tidak ditemukan. Tetap tulis di teks keluhan; minta admin menambahkannya di
                  Master › Asesmen Katalog › Keluhan Utama.
                </li>
              ) : (
                results.map((it, i) => (
                  <li
                    key={it.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => { e.preventDefault(); pick(it); }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex cursor-pointer items-baseline gap-2 px-3 py-2 text-xs",
                      i === active ? "bg-cyan-50" : "bg-white",
                    )}
                  >
                    <span className="font-semibold text-slate-700">{it.nama}</span>
                    <span className="truncate text-[10px] text-slate-400">{it.snomedDisplay}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-400">{it.snomedCode}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {suggestions.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Saran dari teks:</span>
          {suggestions.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => pick(it)}
              className="rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-[11px] font-medium text-cyan-700 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {it.nama}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
