"use client";

// Daftar SEP untuk dipilih di tab SEP Internal: saring No. SEP / kartu / diagnosa di klien,
// klik baris → rujukan internal SEP itu tampil di panel detail (dulu tombol "Detail" malah membuka
// tab Cari, dan jumlah rujukan dimuat saat kursor lewat — tak terjangkau keyboard & memanggil
// V-Claim tiap hover). Baris terpilih ditandai aria-current + latar emerald. Baris tanpa garis.
// Komponen shadcn: Item · Badge · Input · Button.

import { useId, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import { cn } from "@/lib/ui/utils";
import { BADGE, DOT, STATUS_META, fmtTglPendek } from "./sepShared";
import { cocokSep, daftarSepPilihan } from "./sepInternalShared";

export default function SEPInternalList({ terpilih, onPilih }: { terpilih: string | null; onPilih: (noSEP: string) => void }) {
  const id = useId();
  const [q, setQ] = useState("");
  const semua = useMemo(() => daftarSepPilihan(), []);
  const tampil = semua.filter((s) => cocokSep(s, q.trim()));

  return (
    <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
      <div className="flex items-baseline justify-between gap-2 px-4">
        <h3 id={`${id}-judul`} className="text-xs font-semibold">
          Pilih dari daftar SEP
        </h3>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {q.trim() ? `${tampil.length} dari ${semua.length}` : `${semua.length} SEP`}
        </span>
      </div>

      <div className="relative px-4">
        <label htmlFor={`${id}-q`} className="sr-only">
          Saring No. SEP, kartu, atau diagnosa
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-6.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={`${id}-q`}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Saring No. SEP, kartu, diagnosa"
          className="h-8 rounded-lg border-0 bg-slate-100 pl-8 text-xs shadow-none placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:ring-ring/40 md:text-xs"
        />
      </div>

      {tampil.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Tidak ada SEP yang cocok dengan “<span className="text-foreground">{q.trim()}</span>”
          </p>
          <Button variant="ghost" size="xs" onClick={() => setQ("")}>
            <X aria-hidden="true" />
            Hapus saringan
          </Button>
        </div>
      ) : (
        <ul aria-label="Daftar SEP" className="flex flex-col gap-0.5 px-2">
          {tampil.map((s) => {
            const aktif = s.noSEP === terpilih;
            const meta = STATUS_META[s.statusInternal];
            const ri = s.jnsPelayanan === "1";
            return (
              <li key={s.noSEP}>
                <Item
                  asChild
                  size="sm"
                  className={cn(
                    "w-full flex-col flex-nowrap items-stretch gap-1 rounded-xl px-3 py-2.5 text-left transition-colors",
                    aktif ? "bg-emerald-50 text-emerald-950" : "hover:bg-slate-50",
                  )}
                >
                  <button type="button" aria-current={aktif ? "true" : undefined} onClick={() => onPilih(s.noSEP)}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold tracking-wide tabular-nums">{s.noSEP}</span>
                      <Badge className={cn("shrink-0 px-1.5 text-[11px]", BADGE[meta.tone])}>{meta.label}</Badge>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground tabular-nums">{s.diagAwal}</span>
                      <span className="truncate">{s.diagAwalNama ?? "—"}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
                      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOT[ri ? "cyan" : "sky"])} />
                      <span className="truncate">
                        {ri ? "Rawat inap" : "Rawat jalan"} · {s.noKartu} · {fmtTglPendek(s.tglTerbit)}
                      </span>
                    </span>
                  </button>
                </Item>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
