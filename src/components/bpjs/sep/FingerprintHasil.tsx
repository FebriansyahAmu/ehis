"use client";

// Hasil cek fingerprint satu peserta: kartu KESIMPULAN berwarna yang menyebut langkah berikutnya.
// Emerald = syarat terpenuhi (sidik jari sudah divalidasi, atau peserta lolos verifikasi
// pertanyaan); amber = belum → (1) minta peserta validasi lalu cek ulang, (2) bila sidik jari
// tidak terbaca, buka panel verifikasi dengan pertanyaan (tombol aria-expanded/aria-controls).
// Status tidak hanya lewat warna: judul & ikon ikut berganti. Kartu tanpa garis.
// Komponen shadcn: Card · Button · Skeleton · Alert.

import type { ReactNode, Ref } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, Fingerprint, MessageCircleQuestion, RotateCcw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/ui/utils";
import { fmtTglPendek } from "./sepShared";
import { namaPeserta, pesanGalat, type HasilFingerprint } from "./fingerprintShared";
import VerifikasiPertanyaan from "./VerifikasiPertanyaan";

const KARTU = "gap-0 border-0 py-0";
const EASE = [0.22, 1, 0.36, 1] as const;

function Langkah({ no, children }: { no: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 rounded-xl bg-white/70 p-2.5">
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-800 tabular-nums"
      >
        {no}
      </span>
      <div className="min-w-0 flex-1 text-xs/relaxed">{children}</div>
    </li>
  );
}

export default function FingerprintHasil({
  hasil,
  terverifikasiAlt,
  bukaAlt,
  altId,
  judulRef,
  onToggleAlt,
  onUlang,
  onTerverifikasi,
}: {
  hasil: HasilFingerprint;
  /** Peserta sudah lolos verifikasi pertanyaan untuk kartu + tanggal ini. */
  terverifikasiAlt: boolean;
  bukaAlt: boolean;
  /** id panel verifikasi pertanyaan (aria-controls). */
  altId: string;
  /** Judul kesimpulan (tabIndex -1) — tujuan fokus sesudah verifikasi pertanyaan berhasil. */
  judulRef: Ref<HTMLHeadingElement>;
  onToggleAlt: () => void;
  onUlang: () => void;
  onTerverifikasi: () => void;
}) {
  if (hasil.status === "idle") return null;

  if (hasil.status === "loading") {
    return (
      <Card className={cn(KARTU, "gap-3 p-4")} aria-hidden="true">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-4 w-44 rounded" />
          </div>
        </div>
        <Skeleton className="h-14 rounded-xl" />
      </Card>
    );
  }

  if (hasil.status === "error") {
    const kode = hasil.error.type === "BPJSMetaError" ? hasil.error.code : null;
    return (
      <Alert className="rounded-xl border-0 bg-rose-50 p-4 text-rose-900 shadow-sm [&>svg]:size-4">
        <AlertCircle aria-hidden="true" />
        <AlertTitle className="text-sm font-semibold">
          Cek fingerprint gagal
          {kode && <span className="ml-1.5 text-xs font-normal opacity-70 tabular-nums">Kode {kode}</span>}
        </AlertTitle>
        <AlertDescription className="text-xs/relaxed text-current">
          <p>
            {pesanGalat(hasil.error)} <span className="tabular-nums">({hasil.kartu})</span>
          </p>
          <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="mt-1 bg-white">
            <RotateCcw aria-hidden="true" />
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const sudah = hasil.data.kode === "1";
  const lolos = sudah || terverifikasiAlt;
  const nama = namaPeserta(hasil.kartu);
  const Ikon = !sudah && terverifikasiAlt ? ShieldCheck : Fingerprint;
  const judul = sudah ? "Sudah validasi sidik jari" : terverifikasiAlt ? "Terverifikasi lewat pertanyaan" : "Belum validasi sidik jari";

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        key={`${hasil.kartu}|${hasil.tgl}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        <Card
          className={cn(
            KARTU,
            "p-4 transition-colors duration-300",
            lolos ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                lolos ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
              )}
            >
              <Ikon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] opacity-75 tabular-nums">
                Kartu {hasil.kartu} · {fmtTglPendek(hasil.tgl)}
              </p>
              <h2 ref={judulRef} tabIndex={-1} className="mt-0.5 text-sm font-semibold outline-none">
                {judul}
              </h2>
              {nama && <p className="text-xs font-medium">{nama}</p>}
            </div>
          </div>

          {lolos ? (
            <div className="mt-3 flex flex-col gap-1.5">
              <p className="text-xs/relaxed">
                {sudah
                  ? "Syarat sidik jari untuk pelayanan tanggal ini terpenuhi. Lanjutkan penerbitan SEP."
                  : "Peserta menjawab pertanyaan verifikasi dengan benar. Lanjutkan penerbitan SEP."}
              </p>
              {sudah && <p className="text-[11px]/relaxed opacity-75">V-Claim: {hasil.data.status}</p>}
            </div>
          ) : (
            <>
              <p className="mt-3 text-xs/relaxed">Selesaikan validasi dulu agar penerbitan SEP tidak ditolak V-Claim.</p>
              <ol className="mt-3 flex flex-col gap-2">
                <Langkah no={1}>
                  <p>Minta peserta menempelkan jari di alat sidik jari BPJS, lalu cek ulang.</p>
                  <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="mt-1.5 bg-white">
                    <RotateCcw aria-hidden="true" />
                    Cek ulang
                  </Button>
                </Langkah>
                <Langkah no={2}>
                  <p>Sidik jari tidak terbaca? Verifikasi lewat pertanyaan ke peserta.</p>
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    aria-expanded={bukaAlt}
                    aria-controls={altId}
                    onClick={onToggleAlt}
                    className="group mt-1.5 bg-white"
                  >
                    <MessageCircleQuestion aria-hidden="true" />
                    {bukaAlt ? "Tutup pertanyaan" : "Jawab pertanyaan"}
                    <ChevronDown aria-hidden="true" className="transition-transform group-aria-expanded:rotate-180" />
                  </Button>
                </Langkah>
              </ol>
            </>
          )}
        </Card>
      </motion.div>

      <AnimatePresence initial={false}>
        {!lolos && bukaAlt && (
          <motion.div
            key="alt"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <VerifikasiPertanyaan id={altId} kartu={hasil.kartu} tgl={hasil.tgl} onTerverifikasi={onTerverifikasi} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
