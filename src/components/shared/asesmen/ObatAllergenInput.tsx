"use client";

// Input alergen Obat gabungan: satu field — bisa ketik manual ATAU cari & pilih dari Katalog Obat
// (autocomplete). Memilih dari katalog mengisi nama (generik + kekuatan) & menautkan kode BZA;
// mengetik manual = alergen bebas tanpa tautan katalog (BZA dikosongkan).

import { useEffect, useRef, useState } from "react";
import { Search, Pill, X } from "lucide-react";
import type { ObatTersediaDTO } from "@/lib/api/master/obatTersedia";

interface Props {
  value: string;
  bzaKode?: string;
  obatList: ObatTersediaDTO[];
  /** (allergen, bzaKode) — bzaKode "" bila input manual / tanpa tautan katalog. */
  onChange: (allergen: string, bzaKode: string) => void;
  placeholder?: string;
}

export default function ObatAllergenInput({ value, bzaKode, obatList, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = value.trim().toLowerCase();
  const results = q.length >= 1
    ? obatList.filter((o) =>
        o.namaGenerik.toLowerCase().includes(q) ||
        o.namaDagang.toLowerCase().includes(q) ||
        o.kode.toLowerCase().includes(q),
      ).slice(0, 8)
    : [];

  function handleType(v: string) {
    onChange(v, "");                       // ketik manual → lepas tautan BZA
    setOpen(v.trim().length >= 1);
  }
  function pick(o: ObatTersediaDTO) {
    onChange(o.kekuatan ? `${o.namaGenerik} ${o.kekuatan}` : o.namaGenerik, o.bza[0]?.kode ?? "");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleType(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "Ketik nama obat / alergen — atau pilih dari katalog…"}
          className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o)}
              className="flex w-full items-center justify-between gap-2 border-b border-slate-50 px-3 py-2 text-left transition last:border-0 hover:bg-indigo-50/60"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-800">
                  {o.namaGenerik}{o.kekuatan ? ` ${o.kekuatan}` : ""}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {o.namaDagang}{o.bza[0] ? ` · BZA ${o.bza[0].kode}` : ""}
                </p>
              </div>
              <Pill size={12} className="shrink-0 text-indigo-400" />
            </button>
          ))}
        </div>
      )}

      {bzaKode && (
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 ring-1 ring-indigo-100">
          <span className="font-mono text-[10px] font-semibold text-indigo-400">BZA</span>
          <span className="font-mono text-[10px] text-indigo-700">{bzaKode}</span>
          <button
            type="button"
            onClick={() => onChange(value, "")}
            className="ml-0.5 text-indigo-300 transition hover:text-indigo-500"
            aria-label="Lepas tautan BZA"
          >
            <X size={10} />
          </button>
        </span>
      )}
    </div>
  );
}
