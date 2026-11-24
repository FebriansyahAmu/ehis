"use client";

// Kapasitas rujukan per spesialistik di satu rumah sakit tujuan pada hari ini (V-Claim GET
// /Rujukan/ListSpesialistik/PPKRujukan/{kode}/TglRujukan/{tgl}) — membantu memilih tujuan rujukan
// keluar yang masih longgar. Tiap baris: bilah <progress> jumlah rujukan / kapasitas + nada
// (longgar/hampir penuh/penuh) bertulisan, bukan warna saja. Status memuat diturunkan dari kunci.
// Komponen shadcn: Skeleton · Alert.

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtTglPendek, hariIniISO } from "@/components/bpjs/shared/tanggal";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { listSpesialistikRujukanPerPPK } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError, SpesialistikRujukanPPKItem } from "@/lib/bpjs/bpjsShared";
import { BadgeNada, GalatRujukan, Meter } from "./rujukanUi";
import { GALAT_KONEKSI } from "./rujukanShared";

type Hasil = { kunci: string; ok: true; list: SpesialistikRujukanPPKItem[] } | { kunci: string; ok: false; error: BPJSError };

function angka(s: string): number {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function nada(isi: number, kapasitas: number): { tone: BadgeTone; label: string } {
  if (kapasitas <= 0) return { tone: "slate", label: "Tidak menerima" };
  const p = isi / kapasitas;
  if (p >= 1) return { tone: "rose", label: "Penuh" };
  if (p >= 0.75) return { tone: "amber", label: "Hampir penuh" };
  return { tone: "emerald", label: "Longgar" };
}

export default function KapasitasSpesialistik({ id, kodePpk, namaPpk }: { id: string; kodePpk: string; namaPpk: string }) {
  const tgl = hariIniISO();
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const kunci = `${kodePpk}|${tgl}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    listSpesialistikRujukanPerPPK(kodePpk, tgl)
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci, ok: true, list: res.value.response?.list ?? [] } : { kunci, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, kodePpk, tgl]);

  const list = hasil && hasil.ok && !memuat ? [...hasil.list].sort((a, b) => angka(a.persentase) - angka(b.persentase)) : [];

  return (
    <div id={id} className="mt-2 rounded-xl bg-slate-50 p-3">
      <p className="mb-2 text-[11px] text-muted-foreground tabular-nums">
        Kapasitas rujukan {namaPpk} · {fmtTglPendek(tgl)} · paling longgar dulu
      </p>
      {memuat ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </div>
      ) : hasil && !hasil.ok ? (
        <GalatRujukan error={hasil.error} onUlang={() => setUlang((n) => n + 1)} />
      ) : list.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">Belum ada data kapasitas spesialistik.</p>
      ) : (
        <ul className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => {
            const isi = angka(s.jumlahRujukan);
            const kap = angka(s.kapasitas);
            const n = nada(isi, kap);
            return (
              <li key={s.kodeSpesialis} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-medium capitalize">{s.namaSpesialis}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                    {isi}/{kap}
                  </span>
                </div>
                <Meter value={Math.min(isi, kap)} max={Math.max(kap, 1)} tone={n.tone} label={`${s.namaSpesialis}: ${isi} dari ${kap} kapasitas terpakai`} className="mt-1" />
                <div className="mt-1 flex items-center gap-1.5">
                  <BadgeNada tone={n.tone} titik>
                    {n.label}
                  </BadgeNada>
                  <span className="text-[11px] text-muted-foreground tabular-nums">kode {s.kodeSpesialis}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
