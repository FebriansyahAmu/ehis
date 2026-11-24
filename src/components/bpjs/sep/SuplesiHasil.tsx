"use client";

// Hasil tab Suplesi Jasa Raharja: (1) kartu KESIMPULAN berwarna yang menyebut tindakan berikutnya,
// (2) potensi suplesi (SEP KLL terdaftar di Jasa Raharja — nomor SEP bisa disalin untuk kolom
// "No. SEP suplesi" saat menerbitkan SEP), (3) riwayat kecelakaan (data induk) urut terbaru.
// Dua panggilan independen: satu gagal tidak menyembunyikan yang lain. Kartu tanpa garis.
// Komponen shadcn: Card · Item · Badge · Button · Empty · Skeleton · Alert.

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  CarFront,
  Info,
  MapPin,
  RotateCcw,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { cn } from "@/lib/ui/utils";
import type { BPJSError, DataIndukKecelakaanItem, SuplesiJaminanItem } from "@/lib/bpjs/bpjsShared";
import { errorLabel, fmtTglPendek, selisihHari } from "./sepShared";
import { labelJarak, pisahSuplesi, type Bagian, type HasilSuplesi } from "./suplesiShared";

const KARTU = "gap-0 border-0 py-0";
const EASE = [0.22, 1, 0.36, 1] as const;

function Muncul({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function TombolLihat({ no, onBukaSEP }: { no: string; onBukaSEP?: (no: string) => void }) {
  if (!onBukaSEP) return null;
  return (
    <Button variant="ghost" size="xs" onClick={() => onBukaSEP(no)} className="text-muted-foreground">
      Lihat<span className="sr-only"> SEP {no}</span>
      <ArrowUpRight aria-hidden="true" />
    </Button>
  );
}

function GalatBagian({ error, onUlang }: { error: BPJSError; onUlang: () => void }) {
  const { title, desc, kode } = errorLabel(error);
  return (
    <Alert role="note" className="rounded-xl border-0 bg-rose-50 p-3 text-rose-900 [&>svg]:size-4">
      <WifiOff aria-hidden="true" />
      <AlertTitle className="text-xs font-semibold">
        {title}
        {kode && <span className="ml-1.5 font-normal opacity-70 tabular-nums">Kode {kode}</span>}
      </AlertTitle>
      <AlertDescription className="text-xs/relaxed text-current">
        <p>{desc}</p>
        <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="mt-1 bg-white">
          <RotateCcw aria-hidden="true" />
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// ── Kesimpulan ────────────────────────────────────────────

type Nada = "amber" | "sky" | "emerald" | "rose";
const NADA: Record<Nada, { box: string; ikon: string; Ikon: typeof ShieldAlert }> = {
  amber: { box: "bg-amber-50 text-amber-950", ikon: "bg-amber-100 text-amber-700", Ikon: ShieldAlert },
  sky: { box: "bg-sky-50 text-sky-950", ikon: "bg-sky-100 text-sky-700", Ikon: Info },
  emerald: { box: "bg-emerald-50 text-emerald-950", ikon: "bg-emerald-100 text-emerald-700", Ikon: ShieldCheck },
  rose: { box: "bg-rose-50 text-rose-950", ikon: "bg-rose-100 text-rose-700", Ikon: WifiOff },
};

function kesimpulan(
  potensi: Bagian<SuplesiJaminanItem[]>,
  induk: Bagian<DataIndukKecelakaanItem[]>,
  tgl: string,
): { nada: Nada; judul: string; isi: string } {
  if (!potensi.ok && !induk.ok) {
    return { nada: "rose", judul: "Pemeriksaan gagal", isi: "Dua cek V-Claim tidak berhasil. Coba lagi beberapa saat lagi." };
  }
  if (potensi.ok && potensi.data.length > 0) {
    const n = potensi.data.length;
    return {
      nada: "amber",
      judul: `Ada ${n} potensi suplesi`,
      isi: "Untuk perawatan lanjutan dari kecelakaan yang sama, terbitkan SEP dengan Suplesi = Ya dan pakai nomor SEP di daftar potensi sebagai No. SEP suplesi.",
    };
  }
  const nInduk = induk.ok ? induk.data.length : 0;
  if (!potensi.ok) {
    return {
      nada: "sky",
      judul: "Potensi suplesi belum bisa dipastikan",
      isi: `Cek potensi suplesi gagal. ${nInduk > 0 ? `Peserta punya ${nInduk} catatan kecelakaan.` : "Tidak ada catatan kecelakaan."}`,
    };
  }
  if (nInduk > 0) {
    return {
      nada: "sky",
      judul: "Tidak ada potensi suplesi",
      isi: `Peserta punya ${nInduk} catatan kecelakaan, tapi tidak ada yang bisa disuplesi untuk pelayanan ${fmtTglPendek(tgl)}.`,
    };
  }
  return {
    nada: "emerald",
    judul: "Tidak ada riwayat kecelakaan",
    isi: "Belum ada SEP kecelakaan sebelumnya. Bila pasien datang karena kecelakaan baru, terbitkan SEP kecelakaan biasa tanpa suplesi.",
  };
}

function Kesimpulan({ kartu, tgl, potensi, induk }: { kartu: string; tgl: string; potensi: Bagian<SuplesiJaminanItem[]>; induk: Bagian<DataIndukKecelakaanItem[]> }) {
  const k = kesimpulan(potensi, induk, tgl);
  const n = NADA[k.nada];
  return (
    <Card className={cn(KARTU, "flex-row items-start gap-3 p-4", n.box)}>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", n.ikon)}>
        <n.Ikon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] opacity-75 tabular-nums">
          Kartu {kartu} · pelayanan {fmtTglPendek(tgl)}
        </p>
        <CardTitle role="heading" aria-level={2} className="mt-0.5 text-sm">
          {k.judul}
        </CardTitle>
        <p className="mt-1 text-xs/relaxed opacity-90">{k.isi}</p>
      </div>
    </Card>
  );
}

// ── Bagian ────────────────────────────────────────────────

function KepalaBagian({ judul, deskripsi, jumlah, Ikon }: { judul: string; deskripsi: string; jumlah?: number; Ikon: typeof CarFront }) {
  return (
    <CardHeader className="gap-0.5 px-4 pt-4">
      <div className="flex items-center gap-2">
        <Ikon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <CardTitle role="heading" aria-level={3} className="text-xs">
          {judul}
        </CardTitle>
        {jumlah !== undefined && (
          <Badge variant="secondary" className="px-1.5 text-[11px] tabular-nums">
            {jumlah}
          </Badge>
        )}
      </div>
      <CardDescription className="text-[11px]">{deskripsi}</CardDescription>
    </CardHeader>
  );
}

function Fakta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] opacity-70">{label}</dt>
      <dd className="truncate font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function BagianPotensi({ bagian, tgl, onUlang, onBukaSEP }: { bagian: Bagian<SuplesiJaminanItem[]>; tgl: string; onUlang: () => void; onBukaSEP?: (no: string) => void }) {
  return (
    <Card className={KARTU}>
      <KepalaBagian
        judul="Potensi suplesi"
        deskripsi="SEP kecelakaan yang terdaftar di Jasa Raharja"
        jumlah={bagian.ok ? bagian.data.length : undefined}
        Ikon={SearchCheck}
      />
      <CardContent className="flex flex-col gap-2 p-3">
        {!bagian.ok ? (
          <GalatBagian error={bagian.error} onUlang={onUlang} />
        ) : bagian.data.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-muted-foreground">
            Tidak ada potensi suplesi untuk pelayanan {fmtTglPendek(tgl)}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bagian.data.map((it, i) => (
              <motion.li key={`${it.noRegister}-${it.noSep}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Item size="sm" className="flex-col flex-nowrap items-stretch gap-2.5 rounded-xl bg-amber-50/70 p-3 text-amber-950">
                  <div className="flex items-center gap-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] opacity-70">No. SEP untuk suplesi</p>
                      <p className="truncate text-sm font-semibold tracking-wide tabular-nums">{it.noSep}</p>
                    </div>
                    <CopyButton value={it.noSep} label={`nomor SEP ${it.noSep}`} />
                    <TombolLihat no={it.noSep} onBukaSEP={onBukaSEP} />
                  </div>
                  <ItemContent className="flex-none">
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
                      <Fakta label="Register JR">{it.noRegister}</Fakta>
                      <Fakta label="Kejadian">{fmtTglPendek(it.tglKejadian)}</Fakta>
                      <Fakta label="Tgl SEP">{fmtTglPendek(it.tglSep)}</Fakta>
                      {it.noSepAwal && it.noSepAwal !== it.noSep && <Fakta label="SEP awal">{it.noSepAwal}</Fakta>}
                      {it.noSuratJaminan && it.noSuratJaminan !== "-" && <Fakta label="Surat jaminan">{it.noSuratJaminan}</Fakta>}
                    </dl>
                  </ItemContent>
                  {labelJarak(selisihHari(it.tglKejadian, tgl)) && (
                    <p className="text-[11px] opacity-75">Kejadian {labelJarak(selisihHari(it.tglKejadian, tgl))?.toLowerCase()}</p>
                  )}
                </Item>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BagianInduk({ bagian, tgl, onUlang, onBukaSEP }: { bagian: Bagian<DataIndukKecelakaanItem[]>; tgl: string; onUlang: () => void; onBukaSEP?: (no: string) => void }) {
  const urut = bagian.ok ? [...bagian.data].sort((a, b) => b.tglKejadian.localeCompare(a.tglKejadian)) : [];
  return (
    <Card className={KARTU}>
      <KepalaBagian
        judul="Riwayat kecelakaan"
        deskripsi="Data induk kecelakaan peserta di V-Claim, terbaru di atas"
        jumlah={bagian.ok ? bagian.data.length : undefined}
        Ikon={CarFront}
      />
      <CardContent className="flex flex-col gap-2 p-3">
        {!bagian.ok ? (
          <GalatBagian error={bagian.error} onUlang={onUlang} />
        ) : urut.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-muted-foreground">Tidak ada catatan kecelakaan</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {urut.map((it, i) => {
              const suplesi = pisahSuplesi(it.noSEPSuplesi);
              const jarak = labelJarak(selisihHari(it.tglKejadian, tgl));
              return (
                <motion.li key={it.noSEP} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Item size="sm" className="flex-col flex-nowrap items-stretch gap-2 rounded-xl bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Badge className="bg-amber-100 px-2 text-[11px] text-amber-900 tabular-nums">{fmtTglPendek(it.tglKejadian)}</Badge>
                      {jarak && <span className="text-[11px] text-muted-foreground">{jarak}</span>}
                      <span className="ml-auto">
                        <TombolLihat no={it.noSEP} onBukaSEP={onBukaSEP} />
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="min-w-0 truncate text-xs font-semibold tracking-wide tabular-nums">{it.noSEP}</p>
                      <CopyButton value={it.noSEP} label={`nomor SEP ${it.noSEP}`} />
                    </div>
                    {it.ketKejadian && <p className="text-xs/relaxed text-foreground/90">{it.ketKejadian}</p>}
                    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {it.kdProp !== "00" && (
                        <li className="flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden="true" />
                          <span className="tabular-nums">
                            Kode lokasi BPJS {it.kdProp} · {it.kdKab} · {it.kdKec}
                          </span>
                        </li>
                      )}
                      <li className="flex items-center gap-1">
                        <Building2 className="size-3" aria-hidden="true" />
                        <span className="tabular-nums">PPK {it.ppkPelSEP}</span>
                      </li>
                    </ul>
                    {suplesi.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Sudah disuplesi:</span>
                        {suplesi.map((no) => (
                          <Badge key={no} className="bg-amber-50 px-1.5 text-[11px] text-amber-900 tabular-nums">
                            {no}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Item>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Export ────────────────────────────────────────────────

export default function SuplesiHasil({
  hasil,
  onUlang,
  onBukaSEP,
}: {
  hasil: HasilSuplesi;
  onUlang: () => void;
  onBukaSEP?: (noSEP: string) => void;
}) {
  if (hasil.status === "idle") {
    return (
      <Empty className="h-full min-h-72 gap-3 rounded-xl bg-card p-8 text-card-foreground shadow-sm md:p-8">
        <EmptyHeader className="gap-1">
          <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-amber-50 text-amber-700">
            <CarFront className="size-5" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="text-sm font-semibold tracking-normal">Belum ada peserta diperiksa</EmptyTitle>
          <EmptyDescription className="max-w-xs text-xs/relaxed">
            Masukkan nomor kartu dan tanggal pelayanan untuk melihat potensi suplesi dan riwayat kecelakaan
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (hasil.status === "loading") {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-3 xl:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Muncul>
        <Kesimpulan kartu={hasil.kartu} tgl={hasil.tgl} potensi={hasil.potensi} induk={hasil.induk} />
      </Muncul>
      <div className="grid content-start gap-3 xl:grid-cols-2">
        <Muncul delay={0.05}>
          <BagianPotensi bagian={hasil.potensi} tgl={hasil.tgl} onUlang={onUlang} onBukaSEP={onBukaSEP} />
        </Muncul>
        <Muncul delay={0.1}>
          <BagianInduk bagian={hasil.induk} tgl={hasil.tgl} onUlang={onUlang} onBukaSEP={onBukaSEP} />
        </Muncul>
      </div>
    </div>
  );
}

/** Kalimat ringkas hasil untuk live region halaman. */
export function ringkasSuplesi(hasil: HasilSuplesi): string {
  if (hasil.status !== "done") return "";
  return kesimpulan(hasil.potensi, hasil.induk, hasil.tgl).judul;
}
