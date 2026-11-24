"use client";

// Pemilih ruangan RS untuk satu kode penjamin — combobox (Radix Popover + cmdk): ketik untuk
// menyaring nama/kode/jenis, panah ↑↓ + Enter untuk memilih, Esc menutup. Dikelompokkan per jenis
// ruangan; yang sudah terhubung ke kode ini ditandai & tak bisa dipilih lagi. Tanpa nilai default —
// memilih = langsung menambah mapping.

import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { LOCATIONS, kelasLokasi, locType } from "./prShared";

export function RuanganCombobox({ kodeLabel, terhubung, onPick, compact }: {
  /** Mis. "INT — Penyakit Dalam" (untuk nama aksesibel tombol). */
  kodeLabel: string;
  /** id ruangan yang sudah terhubung ke kode ini. */
  terhubung: ReadonlySet<string>;
  onPick: (ruanganId: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => {
    const map = new Map<string, typeof LOCATIONS>();
    for (const l of LOCATIONS) map.set(l.locationType, [...(map.get(l.locationType) ?? []), l]);
    return [...map.entries()].sort((a, b) => locType(a[0]).label.localeCompare(locType(b[0]).label));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Tambah ruangan untuk ${kodeLabel}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-dashed font-semibold transition",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600",
            compact ? "h-7 px-2 m-tiny" : "h-8 px-2.5 m-xs",
            open
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-slate-300 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-800",
          )}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Ruangan
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[min(22rem,calc(100vw-2rem))] p-0" data-accent="emerald">
        {/* cmdk menyaring berdasar `value` (nama + kode + jenis) — pencarian bebas urutan kata. */}
        <Command
          filter={(value, search) => (search.toLowerCase().split(/\s+/).every((w) => value.toLowerCase().includes(w)) ? 1 : 0)}
        >
          <CommandInput placeholder="Cari nama / kode / jenis ruangan…" />
          <CommandList className="max-h-72">
            <CommandEmpty>Ruangan tidak ditemukan.</CommandEmpty>
            {groups.map(([type, rooms]) => {
              const t = locType(type);
              const Icon = t.icon;
              return (
                <CommandGroup key={type} heading={t.label}>
                  {rooms.map((r) => {
                    const sudah = terhubung.has(r.id);
                    const kelas = kelasLokasi(r);
                    return (
                      <CommandItem
                        key={r.id}
                        value={`${r.name} ${r.kode} ${t.label} ${r.id}`}
                        disabled={sudah}
                        onSelect={() => { onPick(r.id); setOpen(false); }}
                        className="gap-2.5 py-2"
                      >
                        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate m-xs font-medium text-slate-800">{r.name}</span>
                          <span className="block truncate font-mono m-tiny text-slate-500">
                            {r.kode}{kelas ? ` · ${kelas}` : ""}
                          </span>
                        </span>
                        {sudah && (
                          <span className="inline-flex shrink-0 items-center gap-1 m-tiny font-semibold text-emerald-700">
                            <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> Terhubung
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
