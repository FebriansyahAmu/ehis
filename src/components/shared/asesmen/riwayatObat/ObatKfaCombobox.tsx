"use client";

// Combobox nama obat Riwayat Obat — BISA DIKETIK bebas, dengan REKOMENDASI dari formularium RS (hasil mapping
// obat ⇄ ruangan, GET /master/obat-tersedia). Memilih rekomendasi menautkan `obatId` → kode KFA ikut (FHIR L07
// MedicationStatement); mengubah teks sesudahnya melepas tautan (kembali ketik bebas).
// Pola ARIA combobox (list autocomplete): input role=combobox + listbox, aria-activedescendant, ↑/↓/Enter/Esc,
// hint status lewat aria-describedby, jumlah hasil diumumkan polite (di-debounce).

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, CircleDashed, Loader2, Pill, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KfaRiwayat } from "@/lib/fhir/links/riwayatObat";
import type { ObatTersediaDTO } from "@/lib/api/master/obatTersedia";
import { cariObat, kfaObat, labelObat, type RekomendasiState } from "./riwayatObatShared";

export interface ObatPilihan {
  nama: string;
  obatId: string | null;
  kfa: KfaRiwayat | null;
}

interface Props {
  /** id input (dipakai <label htmlFor>). */
  id: string;
  label?: string;
  value: ObatPilihan;
  onChange: (v: ObatPilihan) => void;
  rekomendasi: { items: ObatTersediaDTO[]; state: RekomendasiState };
  disabled?: boolean;
}

const JENIS_LABEL: Record<KfaRiwayat["jenis"], string> = { template: "Template", aktual: "Aktual" };

export default function ObatKfaCombobox({ id, label = "Nama Obat", value, onChange, rekomendasi, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [announce, setAnnounce] = useState("");
  const listId = `${id}-list`;
  const hintId = `${id}-hint`;

  const results = useMemo(() => cariObat(rekomendasi.items, value.nama), [rekomendasi.items, value.nama]);
  const query = value.nama.trim();
  const showList = open && query.length > 0;
  const activeIdx = Math.min(active, Math.max(results.length - 1, 0));

  // Jumlah rekomendasi diumumkan sopan, di-debounce agar tak "spam" tiap ketukan.
  useEffect(() => {
    if (!showList || rekomendasi.state !== "done") return;
    const t = setTimeout(
      () => setAnnounce(results.length ? `${results.length} rekomendasi obat` : "Tidak ada rekomendasi di formularium"),
      450,
    );
    return () => clearTimeout(t);
  }, [showList, results.length, rekomendasi.state]);

  function ketik(nama: string) {
    onChange({ nama, obatId: null, kfa: null }); // teks berubah → lepas tautan katalog
    setActive(0);
    setOpen(true);
  }

  function pilih(o: ObatTersediaDTO) {
    onChange({ nama: labelObat(o), obatId: o.id, kfa: kfaObat(o) });
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return; // jangan ganggu komposisi IME
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && showList && results[activeIdx]) {
      e.preventDefault();
      pilih(results[activeIdx]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation(); // Esc pertama hanya menutup daftar, bukan dialog/induk
      setOpen(false);
    }
  }

  const status = value.obatId
    ? value.kfa
      ? { tone: "ok" as const, text: `KFA ${value.kfa.kode} · ${JENIS_LABEL[value.kfa.jenis]} — ikut terkirim ke SatuSehat` }
      : { tone: "warn" as const, text: "Obat katalog belum dipetakan KFA — lengkapi di Master Katalog Obat › Mapping KFA" }
    : query
      ? { tone: "warn" as const, text: "Ketik bebas — pilih dari rekomendasi agar tercatat dengan kode KFA" }
      : { tone: "idle" as const, text: "Ketik nama obat untuk melihat rekomendasi formularium RS" };

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[activeIdx] ? `${listId}-${activeIdx}` : undefined}
          aria-describedby={hintId}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          disabled={disabled}
          value={value.nama}
          onChange={(e) => ketik(e.target.value)}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => { setFocused(false); setOpen(false); }}
          onKeyDown={onKeyDown}
          placeholder="Nama generik / merek…"
          className={cn(
            "h-8 w-full rounded-lg border bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition",
            "focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-50",
            value.obatId && value.kfa ? "border-emerald-300" : "border-slate-200",
          )}
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Rekomendasi obat formularium"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {rekomendasi.state === "loading" ? (
            <li className="flex items-center gap-2 px-3 py-3 text-xs text-slate-500">
              <Loader2 size={13} className="animate-spin text-sky-500" aria-hidden /> Memuat rekomendasi formularium…
            </li>
          ) : rekomendasi.state === "error" ? (
            <li className="flex items-start gap-2 px-3 py-3 text-xs text-rose-600">
              <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden />
              Rekomendasi tidak dapat dimuat — nama obat tetap bisa diketik.
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-3 text-xs leading-relaxed text-slate-500">
              Tidak ada di formularium RS. Nama tetap tersimpan sebagai ketik bebas (tanpa kode KFA).
            </li>
          ) : (
            results.map((o, i) => {
              const kfa = kfaObat(o);
              const sub = [o.namaDagang?.trim(), o.bentuk?.trim()].filter(Boolean).join(" · ");
              return (
                <li
                  key={o.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseDown={(e) => { e.preventDefault(); pilih(o); }} // jaga fokus di input
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex cursor-pointer items-start gap-2 px-3 py-2", i === activeIdx ? "bg-sky-50" : "bg-white")}
                >
                  <Pill size={13} className="mt-0.5 shrink-0 text-sky-500" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-800">{labelObat(o)}</span>
                    {sub && <span className="block truncate text-[10px] text-slate-500">{sub}</span>}
                  </span>
                  {kfa ? (
                    <span className="shrink-0 text-right">
                      <span className="block rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        KFA {kfa.kode}
                      </span>
                      <span className="mt-0.5 block text-[9px] text-slate-400">{JENIS_LABEL[kfa.jenis]}</span>
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Tanpa KFA</span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}

      <p
        id={hintId}
        className={cn(
          "mt-1 flex items-start gap-1 text-[10.5px] leading-snug",
          status.tone === "ok" ? "text-emerald-700" : status.tone === "warn" ? "text-amber-700" : "text-slate-400",
        )}
      >
        {status.tone === "ok" ? (
          <BadgeCheck size={12} className="mt-px shrink-0" aria-hidden />
        ) : status.tone === "warn" ? (
          <AlertCircle size={12} className="mt-px shrink-0" aria-hidden />
        ) : (
          <CircleDashed size={12} className="mt-px shrink-0" aria-hidden />
        )}
        <span>{status.text}</span>
      </p>
      <span className="sr-only" aria-live="polite">{focused && showList ? announce : ""}</span>
    </div>
  );
}
