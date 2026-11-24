"use client";

// Detail rujukan keluar (V-Claim GET /Rujukan/Keluar/{noRujukan}) di Sheet shadcn dari kanan:
// rute RS ini → faskes tujuan, tipe rujukan, poli, diagnosa, tanggal rujukan & rencana kunjungan,
// SEP asal (bisa disalin), catatan. Dimuat saat dibuka; status memuat diturunkan dari kunci data.
// Komponen shadcn: Sheet · Badge · Skeleton · Alert.

import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, CalendarClock } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { fmtTglPendek, selisihHari } from "@/components/bpjs/shared/tanggal";
import { useRsProfil } from "@/lib/master/rsProfilClient";
import { detailRujukanKeluar } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError, RujukanKeluarDetail } from "@/lib/bpjs/bpjsShared";
import { BadgeNada, GalatRujukan } from "./rujukanUi";
import { GALAT_KONEKSI, jenisPelayanan } from "./rujukanShared";

type Detail = { kunci: string; ok: true; data: RujukanKeluarDetail } | { kunci: string; ok: false; error: BPJSError };

const TIPE: Record<string, string> = { "0": "Rujukan penuh", "1": "Rujukan parsial", "2": "Rujuk balik (PRB)" };

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

function Isi({ noRujukan }: { noRujukan: string }) {
  const rs = useRsProfil();
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Detail | null>(null);
  const kunci = `${noRujukan}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    detailRujukanKeluar(noRujukan)
      .then((res) => {
        if (batal) return;
        setHasil(
          res.ok && res.value.response
            ? { kunci, ok: true, data: res.value.response.rujukan }
            : { kunci, ok: false, error: res.ok ? GALAT_KONEKSI : res.error },
        );
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, noRujukan]);

  if (memuat) {
    return (
      <div className="flex flex-col gap-3 px-4" aria-hidden="true">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }
  if (hasil && !hasil.ok) {
    return (
      <div className="px-4">
        <GalatRujukan error={hasil.error} onUlang={() => setUlang((n) => n + 1)} />
      </div>
    );
  }
  if (!hasil?.ok) return null;
  const d = hasil.data;
  const jp = jenisPelayanan(d.jnsPelayanan);
  const jarak = selisihHari(d.tglRujukan, d.tglRencanaKunjungan);

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div className="flex flex-wrap gap-1.5">
        <BadgeNada tone="teal">{TIPE[d.tipeRujukan] ?? d.namaTipeRujukan}</BadgeNada>
        <BadgeNada tone={jp.tone}>{jp.label}</BadgeNada>
        <BadgeNada tone="slate">Kelas {d.kelasRawat}</BadgeNada>
      </div>

      {/* Rute */}
      <div className="flex flex-col gap-1.5">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">Dari</p>
          <p className="text-xs font-semibold">{rs.nama || "RS ini"}</p>
        </div>
        <ArrowDown className="mx-auto size-4 text-teal-600" aria-hidden="true" />
        <div className="rounded-xl bg-teal-50 px-3 py-2.5 text-teal-950">
          <p className="text-[11px] text-teal-700">Dirujuk ke</p>
          <p className="text-xs font-semibold">{d.namaPpkDirujuk}</p>
          <p className="text-[11px] text-teal-700 tabular-nums">
            {d.ppkDirujuk} · Poli {d.namaPoliRujukan}
          </p>
        </div>
      </div>

      <dl className="flex flex-col gap-3">
        <Baris label="Peserta">
          {d.nama} <span className="font-normal text-muted-foreground">· {d.kelamin === "L" ? "Laki-laki" : "Perempuan"}</span>
          <span className="block text-[11px] font-normal text-muted-foreground tabular-nums">
            Kartu {d.noKartu} · lahir {fmtTglPendek(d.tglLahir)}
          </span>
        </Baris>
        <Baris label="Diagnosa">
          <span className="tabular-nums">{d.diagRujukan}</span> <span className="font-normal">· {d.namaDiagRujukan}</span>
        </Baris>
        <Baris label="Tanggal rujukan">
          <span className="tabular-nums">{fmtTglPendek(d.tglRujukan)}</span>
        </Baris>
        <Baris label="Rencana kunjungan">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {fmtTglPendek(d.tglRencanaKunjungan)}
            {jarak !== null && jarak > 0 && <span className="font-normal text-muted-foreground">· {jarak} hari setelah rujukan</span>}
          </span>
        </Baris>
        <Baris label="SEP asal">
          <span className="inline-flex items-center gap-1">
            <span className="tabular-nums">{d.noSep}</span>
            <CopyButton value={d.noSep} label={`nomor SEP ${d.noSep}`} />
          </span>
          <span className="block text-[11px] font-normal text-muted-foreground tabular-nums">Terbit {fmtTglPendek(d.tglSep)}</span>
        </Baris>
      </dl>

      {d.catatan && (
        <div className="rounded-xl bg-slate-50 p-3 text-xs/relaxed">
          <p className="text-[11px] text-muted-foreground">Catatan</p>
          <p>{d.catatan}</p>
        </div>
      )}
    </div>
  );
}

export default function RujukanKeluarSheet({ noRujukan, onClose }: { noRujukan: string | null; onClose: () => void }) {
  // Nomor terakhir tetap ditampilkan selama animasi tutup (props sudah null) — pola adjust-on-render.
  const [tampil, setTampil] = useState(noRujukan);
  if (noRujukan !== null && noRujukan !== tampil) setTampil(noRujukan);

  return (
    <Sheet open={noRujukan !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent data-accent="emerald" className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md">
        <SheetHeader className="gap-0.5 p-4 pr-12">
          <SheetDescription className="text-[11px]">Detail rujukan keluar</SheetDescription>
          <div className="flex min-w-0 items-center gap-1">
            <SheetTitle className="truncate text-sm tracking-wide tabular-nums">{tampil}</SheetTitle>
            {tampil && <CopyButton value={tampil} label={`nomor rujukan ${tampil}`} />}
          </div>
        </SheetHeader>
        {tampil && <Isi key={tampil} noRujukan={tampil} />}
      </SheetContent>
    </Sheet>
  );
}
