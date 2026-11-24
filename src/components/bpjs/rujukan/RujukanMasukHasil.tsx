"use client";

// Hasil cari rujukan masuk. Satu hasil → langsung detail. Banyak hasil (cari per No. kartu) →
// daftar rujukan terbaru dulu yang bisa disaring per asal (Semua/FKTP/FKRTL, tombol aria-pressed),
// baris terpilih `aria-current` + latar emerald, detail di bawahnya. Bila salah satu asal gagal
// dimuat, hasil asal lain tetap tampil + catatan "coba lagi". Komponen shadcn: Item · Badge ·
// Button · Empty · Skeleton · Card.

import { useState } from "react";
import { motion } from "framer-motion";
import { Inbox, RotateCcw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtTglPendek } from "@/components/bpjs/shared/tanggal";
import { cn } from "@/lib/ui/utils";
import type { RujukanRecord } from "@/lib/bpjs/bpjsShared";
import RujukanMasukDetail from "./RujukanMasukDetail";
import { BadgeNada, GalatRujukan, KARTU } from "./rujukanUi";
import { statusBerlaku, type Asal, type HasilMasuk } from "./rujukanShared";

const FILTER: { value: Asal | "semua"; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "FKTP", label: "FKTP" },
  { value: "FKRTL", label: "FKRTL" },
];

function Kosong({ ikon: Ikon, nada, judul, isi }: { ikon: typeof Inbox; nada: string; judul: string; isi: string }) {
  return (
    <Empty className="h-full min-h-72 gap-3 rounded-xl bg-card p-8 text-card-foreground shadow-sm md:p-8">
      <EmptyHeader className="gap-1">
        <EmptyMedia variant="icon" className={cn("mb-2 size-11 rounded-xl", nada)}>
          <Ikon className="size-5" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-semibold tracking-normal">{judul}</EmptyTitle>
        <EmptyDescription className="max-w-sm text-xs/relaxed">{isi}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function BarisRujukan({ r, aktif, onPilih, index }: { r: RujukanRecord; aktif: boolean; onPilih: () => void; index: number }) {
  const b = statusBerlaku(r.masaBerlaku.from, r.masaBerlaku.to);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 6) * 0.03 }}>
      <Item
        asChild
        size="sm"
        className={cn(
          "w-full flex-nowrap gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
          aktif ? "bg-emerald-50" : "hover:bg-slate-50",
        )}
      >
        <button type="button" onClick={onPilih} aria-current={aktif ? "true" : undefined}>
          <ItemContent className="min-w-0 gap-0.5">
            <ItemTitle className="w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
              <span className="truncate font-semibold tracking-wide tabular-nums">{r.noRujukan}</span>
              <BadgeNada tone={b.tone} titik>
                {b.label}
              </BadgeNada>
            </ItemTitle>
            <ItemDescription className="line-clamp-1 text-[11px] text-wrap">
              {r.asalRujukan} {r.ppkAsal.nama} · {r.poli.nama} · <span className="tabular-nums">{fmtTglPendek(r.tglRujukan)}</span>
            </ItemDescription>
          </ItemContent>
        </button>
      </Item>
    </motion.li>
  );
}

export default function RujukanMasukHasil({
  hasil,
  terpilih,
  onPilih,
  onUlang,
}: {
  hasil: HasilMasuk;
  terpilih: string | null;
  onPilih: (noRujukan: string) => void;
  onUlang: () => void;
}) {
  const [asal, setAsal] = useState<Asal | "semua">("semua");

  if (hasil.status === "idle") {
    return (
      <Kosong
        ikon={Inbox}
        nada="bg-teal-50 text-teal-700"
        judul="Cari rujukan masuk"
        isi="Ketik No. rujukan dari surat rujukan pasien, atau No. kartu BPJS untuk melihat semua rujukan milik peserta."
      />
    );
  }

  if (hasil.status === "loading") {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-14 rounded-xl" />
        <Card className={cn(KARTU, "gap-3 p-4")}>
          <Skeleton className="h-5 w-64 rounded" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </Card>
      </div>
    );
  }

  const { list, gagal, mode, q } = hasil;

  if (list.length === 0) {
    if (gagal.length > 0) return <GalatRujukan error={gagal[0].error} onUlang={onUlang} />;
    return (
      <Kosong
        ikon={SearchX}
        nada="bg-slate-100 text-slate-500"
        judul="Rujukan tidak ditemukan"
        isi={
          mode === "kartu"
            ? `Peserta dengan kartu ${q} tidak punya rujukan masuk, baik dari FKTP maupun FKRTL.`
            : `No. ${q} tidak terdaftar sebagai rujukan FKTP maupun FKRTL. Periksa lagi nomor di surat rujukan.`
        }
      />
    );
  }

  const tampil = asal === "semua" ? list : list.filter((r) => r.asalRujukan === asal);
  const dipilih = tampil.find((r) => r.noRujukan === terpilih) ?? tampil[0] ?? null;

  return (
    <div className="flex flex-col gap-3">
      {gagal.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Rujukan {gagal.map((g) => g.asal).join(" & ")} gagal dimuat, hasil di bawah mungkin belum lengkap.
          <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="bg-white">
            <RotateCcw aria-hidden="true" />
            Coba lagi
          </Button>
        </p>
      )}

      {list.length > 1 && (
        <Card className={cn(KARTU, "gap-2 p-2")}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1">
            <h3 className="text-xs font-semibold">
              <span className="tabular-nums">{list.length}</span> rujukan{mode === "kartu" && <span className="font-normal text-muted-foreground tabular-nums"> · kartu {q}</span>}
            </h3>
            <div role="group" aria-label="Saring asal rujukan" className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
              {FILTER.map((f) => {
                const n = f.value === "semua" ? list.length : list.filter((r) => r.asalRujukan === f.value).length;
                return (
                  <Button
                    key={f.value}
                    type="button"
                    size="xs"
                    variant="ghost"
                    aria-pressed={asal === f.value}
                    onClick={() => setAsal(f.value)}
                    className="h-6 px-2 text-[11px] text-muted-foreground aria-pressed:bg-white aria-pressed:text-foreground aria-pressed:shadow-xs"
                  >
                    {f.label}
                    <span className="tabular-nums opacity-70">{n}</span>
                  </Button>
                );
              })}
            </div>
          </div>
          {tampil.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">Tidak ada rujukan {asal} untuk peserta ini.</p>
          ) : (
            <ul aria-label="Daftar rujukan" className="flex flex-col gap-0.5">
              {tampil.map((r, i) => (
                <BarisRujukan key={r.noRujukan} r={r} index={i} aktif={dipilih?.noRujukan === r.noRujukan} onPilih={() => onPilih(r.noRujukan)} />
              ))}
            </ul>
          )}
        </Card>
      )}

      {dipilih && <RujukanMasukDetail rujukan={dipilih} />}
    </div>
  );
}
