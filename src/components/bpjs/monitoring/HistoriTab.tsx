"use client";

// Tab Histori pelayanan: form di kiri (No. kartu + periode ≤ 90 hari, lengket saat digulir di
// layar lebar) dan hasil di kanan. Bisa dibuka dari tab lain lewat tombol "Histori": kartu dan
// periode 90 hari di sekitar kunjungan itu langsung terisi & dicari, lalu fokus pindah ke judul
// hasil (tombol asalnya sudah tersembunyi bersama tab lama). Status memuat diturunkan dari kunci
// pencarian — tanpa setState sinkron di effect. Komponen shadcn: Card.

import { useEffect, useId, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { GALAT_KONEKSI, tidakDitemukan } from "@/components/bpjs/shared/galat";
import { hariIniISO } from "@/components/bpjs/shared/tanggal";
import { KARTU } from "@/components/bpjs/shared/vclaimUi";
import { monitoringHistoriPelayanan } from "@/lib/bpjs/vClaimMonitoring";
import HistoriForm, { type PeriodeHistori } from "./HistoriForm";
import HistoriHasil, { type CariHistori, type HasilHistori } from "./HistoriHasil";
import { MAKS_HARI, periodeMundur, periodeSekitar } from "./monitoringShared";

/** Permintaan dari tab lain: `n` naik tiap klik agar peserta yang sama tetap dicari ulang. */
export interface PrefillHistori {
  kartu: string;
  acuan: string;
  n: number;
}

type Cari = CariHistori & { n: number };

export default function HistoriTab({ prefill, aktif }: { prefill: PrefillHistori | null; aktif: boolean }) {
  const id = useId();
  const hariIni = hariIniISO();
  const inputRef = useRef<HTMLInputElement>(null);
  const judulHasilRef = useRef<HTMLHeadingElement>(null);
  const [kartu, setKartu] = useState("");
  const [periode, setPeriode] = useState<PeriodeHistori>(() => periodeMundur(hariIniISO(), MAKS_HARI));
  const [cari, setCari] = useState<Cari | null>(null);
  const [hasil, setHasil] = useState<HasilHistori | null>(null);

  // Terapkan permintaan dari tab lain sekali per `n` — pola adjust-on-render.
  const [prefillN, setPrefillN] = useState<number | null>(null);
  if (prefill && prefill.n !== prefillN) {
    const p = periodeSekitar(prefill.acuan, hariIni);
    setPrefillN(prefill.n);
    setKartu(prefill.kartu);
    setPeriode(p);
    setCari((c) => ({ kartu: prefill.kartu, ...p, n: (c?.n ?? 0) + 1 }));
  }

  // Fokus ke judul hasil setelah tab ini benar-benar tampil (sekali per permintaan).
  const sudahFokus = useRef<number | null>(null);
  useEffect(() => {
    if (!aktif || prefillN === null || sudahFokus.current === prefillN) return;
    sudahFokus.current = prefillN;
    judulHasilRef.current?.focus();
  }, [aktif, prefillN]);

  const kunci = cari ? `${cari.kartu}|${cari.mulai}|${cari.akhir}#${cari.n}` : null;
  const memuat = kunci !== null && hasil?.kunci !== kunci;

  useEffect(() => {
    if (!cari || kunci === null) return;
    let batal = false;
    monitoringHistoriPelayanan(cari.kartu, cari.mulai, cari.akhir)
      .then((res) => {
        if (batal) return;
        if (res.ok) {
          const list = [...(res.value.response ?? [])].sort((a, b) => b.tglSep.localeCompare(a.tglSep));
          setHasil({ kunci, ok: true, list });
        } else if (tidakDitemukan(res.error)) {
          setHasil({ kunci, ok: true, list: [] });
        } else {
          setHasil({ kunci, ok: false, error: res.error });
        }
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [cari, kunci]);

  function mulaiCari(k: string, p: PeriodeHistori) {
    setCari((c) => ({ kartu: k, ...p, n: (c?.n ?? 0) + 1 }));
  }

  const status = memuat || !hasil ? "" : hasil.ok ? `${hasil.list.length} pelayanan ditemukan` : "Histori pelayanan gagal dimuat";

  return (
    <div className="grid items-start gap-4 p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className={`${KARTU} lg:sticky lg:top-5`}>
        <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-4 p-4">
          <div>
            <h2 id={`${id}-judul`} className="text-sm font-semibold">
              Cari histori peserta
            </h2>
            <p className="text-xs text-muted-foreground">SEP peserta di semua faskes dalam satu periode</p>
          </div>
          <HistoriForm
            judulId={`${id}-judul`}
            kartu={kartu}
            onKartu={setKartu}
            periode={periode}
            onPeriode={setPeriode}
            onSubmit={mulaiCari}
            busy={memuat}
            inputRef={inputRef}
          />
        </section>
      </Card>

      <Card className={KARTU}>
        <section aria-labelledby={`${id}-hasil`} aria-busy={memuat} className="py-4">
          <HistoriHasil
            cari={cari}
            memuat={memuat}
            hasil={memuat ? null : hasil}
            onUlang={() => cari && mulaiCari(cari.kartu, { mulai: cari.mulai, akhir: cari.akhir })}
            judulId={`${id}-hasil`}
            judulRef={judulHasilRef}
          />
        </section>
      </Card>

      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
