"use client";

// Pilih poli tujuan + dokter untuk surat rencana kontrol / SPRI langsung dari referensi V-Claim
// (GET /RencanaKontrol/ListSpesialistik & /JadwalPraktekDokter) — dulu dua tab Referensi terpisah
// + <select> statis yang tidak tahu kapasitas. Poli dimuat untuk nomor (SEP/kartu) + tanggal
// rencana, tampil sebagai kartu pilihan (RadioGroup) berisi bilah kapasitas terpakai; poli penuh
// tidak bisa dipilih. Dokter dimuat setelah poli dipilih (jadwal praktik + kapasitas); bila hanya
// satu dokter, langsung terpilih. Pilihan yang tak lagi tersedia sesudah tanggal/poli berganti
// dikosongkan. Status memuat diturunkan dari kunci. Komponen shadcn: RadioGroup · Label · Skeleton.

import { useEffect, useState } from "react";
import { CalendarClock, Stethoscope } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { PesanGalat } from "@/components/bpjs/shared/formUi";
import { GALAT_KONEKSI, tidakDitemukan } from "@/components/bpjs/shared/galat";
import { GalatVClaim, Meter } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { getDokterRK, getPoliRK } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { BPJSError, DokterRKSpecItem, PoliRKSpecItem } from "@/lib/bpjs/bpjsShared";
import type { KodeJenisKontrol } from "./rencanaKontrolShared";

type Hasil<T> = { kunci: string; ok: true; list: T[] } | { kunci: string; ok: false; error: BPJSError };

export interface Pilihan {
  kode: string;
  nama: string;
}

const KARTU = // relative: radio sr-only menempel ke kartunya, bukan ke panel di atasnya
  "relative flex cursor-pointer flex-col items-stretch gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs transition-colors hover:bg-slate-100 has-data-[state=checked]:bg-emerald-50 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-emerald-600 has-data-[state=checked]:ring-inset has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-emerald-600 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-disabled:hover:bg-slate-50";

function angka(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function Petunjuk({ children }: { children: string }) {
  return <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-xs text-muted-foreground">{children}</p>;
}

export default function PilihPoliDokter({
  id,
  jenis,
  nomor,
  tgl,
  poli,
  onPoli,
  dokter,
  onDokter,
  galatPoli,
  galatDokter,
}: {
  /** Awalan id (fokus saat simpan gagal: `${id}-poli`, `${id}-dokter`). */
  id: string;
  jenis: KodeJenisKontrol;
  /** No. SEP (kontrol) / No. kartu (SPRI) yang sudah diperiksa; null = belum siap. */
  nomor: string | null;
  /** Tanggal rencana yang sah; null = belum sah. */
  tgl: string | null;
  poli: Pilihan | null;
  onPoli: (p: Pilihan | null) => void;
  dokter: Pilihan | null;
  onDokter: (d: Pilihan | null) => void;
  galatPoli: string | null;
  galatDokter: string | null;
}) {
  const [ulangPoli, setUlangPoli] = useState(0);
  const [ulangDokter, setUlangDokter] = useState(0);
  const [hasilPoli, setHasilPoli] = useState<Hasil<PoliRKSpecItem> | null>(null);
  const [hasilDokter, setHasilDokter] = useState<Hasil<DokterRKSpecItem> | null>(null);

  const siap = nomor !== null && tgl !== null;
  const kunciPoli = siap ? `${jenis}|${nomor}|${tgl}#${ulangPoli}` : null;
  const memuatPoli = kunciPoli !== null && hasilPoli?.kunci !== kunciPoli;
  const kunciDokter = siap && poli ? `${jenis}|${poli.kode}|${tgl}#${ulangDokter}` : null;
  const memuatDokter = kunciDokter !== null && hasilDokter?.kunci !== kunciDokter;

  useEffect(() => {
    if (kunciPoli === null || nomor === null || tgl === null) return;
    let batal = false;
    getPoliRK(jenis, nomor, tgl)
      .then((res) => {
        if (batal) return;
        const list = res.ok ? (res.value.response ?? []) : tidakDitemukan(res.error) ? [] : null;
        if (list === null) {
          if (!res.ok) setHasilPoli({ kunci: kunciPoli, ok: false, error: res.error });
          return;
        }
        setHasilPoli({ kunci: kunciPoli, ok: true, list });
        // Poli terpilih tak lagi tersedia / penuh pada tanggal ini → kosongkan pilihan.
        if (poli) {
          const ada = list.find((p) => p.kodePoli === poli.kode);
          if (!ada || angka(ada.persentase) >= 100) onPoli(null);
        }
      })
      .catch(() => {
        if (!batal) setHasilPoli({ kunci: kunciPoli, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
    // poli/onPoli sengaja tidak jadi dependensi: daftar dimuat ulang hanya saat nomor/tanggal berganti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciPoli, jenis, nomor, tgl]);

  useEffect(() => {
    if (kunciDokter === null || tgl === null || !poli) return;
    let batal = false;
    getDokterRK(jenis, poli.kode, tgl)
      .then((res) => {
        if (batal) return;
        const list = res.ok ? (res.value.response ?? []) : tidakDitemukan(res.error) ? [] : null;
        if (list === null) {
          if (!res.ok) setHasilDokter({ kunci: kunciDokter, ok: false, error: res.error });
          return;
        }
        setHasilDokter({ kunci: kunciDokter, ok: true, list });
        const masihAda = dokter && list.some((d) => d.kodeDokter === dokter.kode);
        if (!masihAda) {
          // Satu-satunya dokter langsung dipilih; pilihan lama yang hilang dikosongkan.
          if (list.length === 1) onDokter({ kode: list[0].kodeDokter, nama: list[0].namaDokter });
          else if (dokter) onDokter(null);
        }
      })
      .catch(() => {
        if (!batal) setHasilDokter({ kunci: kunciDokter, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
    // dokter/onDokter sengaja tidak jadi dependensi (lihat efek poli).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciDokter, jenis, tgl, poli?.kode]);

  const daftarPoli = hasilPoli?.ok && !memuatPoli ? hasilPoli.list : [];
  const daftarDokter = hasilDokter?.ok && !memuatDokter ? hasilDokter.list : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Poli tujuan */}
      <div className="flex flex-col gap-1.5">
        <span id={`${id}-poli-label`} className="text-xs font-medium">
          Poli tujuan
          <span aria-hidden="true" className="text-rose-600">
            {" "}*
          </span>
          <span className="sr-only"> (wajib)</span>
        </span>
        {!siap ? (
          <Petunjuk>{nomor === null ? "Periksa nomor di langkah 1 untuk melihat poli yang tersedia" : "Pilih tanggal rencana yang sah"}</Petunjuk>
        ) : memuatPoli ? (
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : hasilPoli && !hasilPoli.ok ? (
          <GalatVClaim error={hasilPoli.error} objek="Poli" onUlang={() => setUlangPoli((n) => n + 1)} />
        ) : daftarPoli.length === 0 ? (
          <Petunjuk>Tidak ada poli yang menerima rencana kontrol pada tanggal ini</Petunjuk>
        ) : (
          <RadioGroup
            value={poli?.kode ?? ""}
            onValueChange={(v) => {
              const p = daftarPoli.find((x) => x.kodePoli === v);
              if (!p) return;
              onPoli({ kode: p.kodePoli, nama: p.namaPoli });
              onDokter(null);
            }}
            aria-labelledby={`${id}-poli-label`}
            aria-describedby={galatPoli ? `${id}-poli-err` : undefined}
            aria-invalid={Boolean(galatPoli)}
            className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {daftarPoli.map((p, i) => {
              const kap = angka(p.kapasitas);
              const isi = angka(p.jmlRencanaKontroldanRujukan);
              const pct = Math.round(angka(p.persentase));
              const penuh = pct >= 100;
              const itemId = i === 0 ? `${id}-poli` : `${id}-poli-${p.kodePoli}`;
              return (
                <Label key={p.kodePoli} htmlFor={itemId} className={KARTU}>
                  <RadioGroupItem id={itemId} value={p.kodePoli} disabled={penuh} className="sr-only" />
                  <span className="flex min-w-0 items-baseline justify-between gap-2">
                    <span className="truncate font-medium" title={p.namaPoli}>
                      {p.namaPoli}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{p.kodePoli}</span>
                  </span>
                  <Meter
                    value={Math.min(isi, kap)}
                    max={Math.max(kap, 1)}
                    tone={penuh ? "rose" : pct >= 75 ? "amber" : "emerald"}
                    label={`Kapasitas ${p.namaPoli} terpakai ${pct} persen`}
                  />
                  <span className={cn("text-[11px] tabular-nums", penuh ? "font-medium text-rose-700" : "text-muted-foreground")}>
                    {penuh ? "Penuh" : `${isi}/${kap} terisi · sisa ${Math.max(kap - isi, 0)}`}
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        )}
        {galatPoli && <PesanGalat id={`${id}-poli-err`}>{galatPoli}</PesanGalat>}
      </div>

      {/* Dokter */}
      <div className="flex flex-col gap-1.5">
        <span id={`${id}-dokter-label`} className="text-xs font-medium">
          Dokter
          <span aria-hidden="true" className="text-rose-600">
            {" "}*
          </span>
          <span className="sr-only"> (wajib)</span>
        </span>
        {!siap || !poli ? (
          <Petunjuk>Pilih poli tujuan untuk melihat jadwal dokter</Petunjuk>
        ) : memuatDokter ? (
          <div className="grid gap-1.5 sm:grid-cols-2" aria-hidden="true">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : hasilDokter && !hasilDokter.ok ? (
          <GalatVClaim error={hasilDokter.error} objek="Dokter" onUlang={() => setUlangDokter((n) => n + 1)} />
        ) : daftarDokter.length === 0 ? (
          <Petunjuk>Tidak ada dokter berpraktik di poli ini pada tanggal tersebut</Petunjuk>
        ) : (
          <RadioGroup
            value={dokter?.kode ?? ""}
            onValueChange={(v) => {
              const d = daftarDokter.find((x) => x.kodeDokter === v);
              if (d) onDokter({ kode: d.kodeDokter, nama: d.namaDokter });
            }}
            aria-labelledby={`${id}-dokter-label`}
            aria-describedby={galatDokter ? `${id}-dokter-err` : undefined}
            aria-invalid={Boolean(galatDokter)}
            className="grid gap-1.5 sm:grid-cols-2"
          >
            {daftarDokter.map((d, i) => {
              const itemId = i === 0 ? `${id}-dokter` : `${id}-dokter-${d.kodeDokter}`;
              return (
                <Label key={d.kodeDokter} htmlFor={itemId} className={cn(KARTU, "flex-row items-center gap-3")}>
                  <RadioGroupItem id={itemId} value={d.kodeDokter} className="sr-only" />
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-xs">
                    <Stethoscope className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{d.namaDokter}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                      <CalendarClock className="size-3" aria-hidden="true" />
                      {d.jadwalPraktek} · kapasitas {d.kapasitas}
                    </span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        )}
        {galatDokter && <PesanGalat id={`${id}-dokter-err`}>{galatDokter}</PesanGalat>}
      </div>
    </div>
  );
}
