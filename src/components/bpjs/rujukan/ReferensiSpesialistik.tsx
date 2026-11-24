"use client";

// Referensi spesialistik V-Claim (GET /referensi/spesialistik) — dimuat sekali, disaring di klien
// (kode/nama), ditampilkan sebagai kisi ringkas dengan kode yang bisa disalin (dulu tabel 3 kolom
// bergaris). Status memuat diturunkan dari kunci data.
// Komponen shadcn: Item · Input · Skeleton · Alert.

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { listSpesialistik, type SpesialistikRefRecord } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { GalatRujukan, KolomSaring } from "./rujukanUi";
import { GALAT_KONEKSI } from "./rujukanShared";

type Hasil = { kunci: number; ok: true; list: SpesialistikRefRecord[] } | { kunci: number; ok: false; error: BPJSError };

export default function ReferensiSpesialistik() {
  const id = useId();
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const memuat = hasil?.kunci !== ulang;

  useEffect(() => {
    let batal = false;
    listSpesialistik()
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci: ulang, ok: true, list: res.value.response ?? [] } : { kunci: ulang, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci: ulang, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [ulang]);

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];
  const s = q.trim().toLowerCase();
  const tampil = s ? list.filter((r) => r.kdSpesialis.toLowerCase().includes(s) || r.nmSpesialis.toLowerCase().includes(s)) : list;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 px-4">
        <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring kode atau nama spesialistik" placeholder="Saring kode atau nama spesialistik" />
        {!memuat && hasil?.ok && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {s ? `${tampil.length} dari ${list.length}` : `${list.length} spesialistik`}
          </span>
        )}
      </div>

      <div className="px-2">
        {memuat ? (
          <div className="grid gap-1.5 px-1 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        ) : hasil && !hasil.ok ? (
          <div className="px-2">
            <GalatRujukan error={hasil.error} objek="Referensi" onUlang={() => setUlang((n) => n + 1)} />
          </div>
        ) : tampil.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Tidak ada spesialistik yang cocok dengan “<span className="text-foreground">{q.trim()}</span>”
            </p>
            <Button variant="ghost" size="xs" onClick={() => setQ("")}>
              <X aria-hidden="true" />
              Hapus saringan
            </Button>
          </div>
        ) : (
          <ul aria-label="Spesialistik" className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {tampil.map((r) => (
              <li key={r.kdSpesialis}>
                <Item size="sm" className="flex-nowrap gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50">
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-slate-100 py-0.5 pr-0.5 pl-1.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                    {r.kdSpesialis}
                    <CopyButton value={r.kdSpesialis} label={`kode spesialistik ${r.kdSpesialis}`} />
                  </span>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full min-w-0 text-xs">
                      <span className="truncate">{r.nmSpesialis}</span>
                    </ItemTitle>
                  </ItemContent>
                </Item>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
