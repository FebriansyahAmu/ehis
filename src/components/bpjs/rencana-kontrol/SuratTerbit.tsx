"use client";

// Tampilan sesudah surat rencana kontrol / SPRI terbit atau diubah: nomor surat besar + salin,
// ringkasan (peserta, tanggal rencana, poli, dokter), lalu aksi lanjut. Judul menerima fokus saat
// tampil (tombol simpan sudah hilang) dan hasilnya diumumkan lewat role="status".
// Komponen shadcn: Card · Button · Badge.

import { useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CircleCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { fmtTgl, hariIniISO } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, KARTU } from "@/components/bpjs/shared/vclaimUi";
import { JENIS_SURAT, jadwalSurat, type JenisSurat } from "./rencanaKontrolShared";

export interface RingkasanSurat {
  nama: string;
  /** "No. SEP asal" / "No. kartu". */
  labelNomor: string;
  nomor: string;
  tgl: string;
  poli: string;
  dokter: string;
}

export default function SuratTerbit({
  jenis,
  noSurat,
  diubah,
  ringkasan,
  onBaru,
  onKeDaftar,
}: {
  jenis: JenisSurat;
  noSurat: string;
  diubah: boolean;
  ringkasan: RingkasanSurat;
  onBaru: () => void;
  onKeDaftar: () => void;
}) {
  const id = useId();
  const judulRef = useRef<HTMLHeadingElement>(null);
  const j = JENIS_SURAT[jenis];
  const jadwal = jadwalSurat(ringkasan.tgl, hariIniISO());
  const judul = diubah ? `${j.label} diperbarui` : `${j.label} terbit`;

  useEffect(() => {
    judulRef.current?.focus();
  }, [noSurat]);

  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          aria-labelledby={`${id}-judul`}
          className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-8 text-center"
        >
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CircleCheck className="size-6" />
          </span>
          <div className="flex flex-col items-center gap-1">
            <h2 id={`${id}-judul`} ref={judulRef} tabIndex={-1} className="text-sm font-semibold outline-none">
              {judul}
            </h2>
            <p className="flex items-center gap-1 text-lg font-semibold tracking-wide tabular-nums">
              {noSurat}
              <CopyButton value={noSurat} label={`nomor surat ${noSurat}`} />
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <BadgeNada tone={j.tone}>{j.label}</BadgeNada>
              <BadgeNada tone={jadwal.tone} titik>
                {jadwal.label}
              </BadgeNada>
            </div>
          </div>

          <dl className="grid w-full gap-x-4 gap-y-2.5 rounded-xl bg-slate-50 p-3 text-left text-xs sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">Peserta</dt>
              <dd className="truncate font-medium">{ringkasan.nama}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">{ringkasan.labelNomor}</dt>
              <dd className="truncate font-medium tabular-nums">{ringkasan.nomor}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">Tanggal rencana</dt>
              <dd className="font-medium tabular-nums">{fmtTgl(ringkasan.tgl)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">Poli · dokter</dt>
              <dd className="font-medium">
                {ringkasan.poli}
                <span className="block truncate font-normal text-muted-foreground">{ringkasan.dokter}</span>
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={onKeDaftar} className="text-xs">
              <ArrowLeft aria-hidden="true" />
              Ke daftar surat
            </Button>
            <Button size="sm" onClick={onBaru} className="bg-emerald-600 text-xs text-white hover:bg-emerald-700">
              <Plus aria-hidden="true" />
              Buat {j.sebutan} lain
            </Button>
          </div>
        </motion.section>
      </Card>
      <p role="status" className="sr-only">
        {`${judul}, nomor ${noSurat}`}
      </p>
    </div>
  );
}
