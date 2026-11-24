"use client";

// Tab Fingerprint: kiri = form cek (No. kartu + tanggal pelayanan) + kesimpulan, kanan = daftar
// peserta yang sudah validasi sidik jari per tanggal. "Cek" di daftar mengisi form dan menjalankan
// pemeriksaan (layar sempit: hasil digulir ke pandangan). Peserta yang lolos verifikasi pertanyaan
// ditandai per kartu + tanggal selama sesi; sesudahnya fokus pindah ke judul kesimpulan (panel
// pertanyaan yang memegang fokus hilang). Respons basi diabaikan; hasil diumumkan lewat role="status".

import { useCallback, useId, useRef, useState } from "react";
import { Fingerprint, Info } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFingerPrint } from "@/lib/bpjs/vClaimSEP";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { hariIniISO } from "./sepShared";
import { GALAT_KONEKSI } from "./suplesiShared";
import CekKartuForm from "./CekKartuForm";
import FingerprintHasil from "./FingerprintHasil";
import FingerprintList from "./FingerprintList";
import { SAMPLE_FINGERPRINT, kunciCek, pesanGalat, type HasilFingerprint } from "./fingerprintShared";

const KARTU = "min-w-0 gap-0 border-0 py-0";

const TIDAK_ADA: BPJSError = {
  type: "BPJSMetaError",
  code: "201",
  message: "Data fingerprint peserta tidak tersedia",
  endpoint: "",
  retryable: false,
};

function ringkas(h: HasilFingerprint, lolosAlt: boolean): string {
  if (h.status === "done") {
    if (h.data.kode === "1") return `Kartu ${h.kartu}: sudah validasi sidik jari`;
    return lolosAlt ? `Kartu ${h.kartu}: terverifikasi lewat pertanyaan` : `Kartu ${h.kartu}: belum validasi sidik jari`;
  }
  if (h.status === "error") return `Cek fingerprint gagal: ${pesanGalat(h.error)}`;
  return "";
}

export default function FingerprintTab({ onBukaSEP }: { onBukaSEP?: (noSEP: string) => void }) {
  const judulId = useId();
  const altId = useId();
  const [kartu, setKartu] = useState("");
  const [tgl, setTgl] = useState(hariIniISO);
  const [hasil, setHasil] = useState<HasilFingerprint>({ status: "idle" });
  const [lolosAlt, setLolosAlt] = useState<ReadonlySet<string>>(() => new Set());
  const [bukaAlt, setBukaAlt] = useState(false);
  const req = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasilRef = useRef<HTMLElement>(null);
  const judulHasilRef = useRef<HTMLHeadingElement>(null);

  const periksa = useCallback(async (k: string, t: string, gulir = false) => {
    const rid = ++req.current;
    setBukaAlt(false);
    setHasil({ status: "loading", kartu: k, tgl: t });
    if (gulir) requestAnimationFrame(() => hasilRef.current?.scrollIntoView({ block: "nearest" }));
    let next: HasilFingerprint;
    try {
      const res = await getFingerPrint(k, t);
      if (!res.ok) next = { status: "error", kartu: k, tgl: t, error: res.error };
      else if (!res.value.response) next = { status: "error", kartu: k, tgl: t, error: TIDAK_ADA };
      else next = { status: "done", kartu: k, tgl: t, data: res.value.response };
    } catch {
      next = { status: "error", kartu: k, tgl: t, error: GALAT_KONEKSI };
    }
    if (rid === req.current) setHasil(next); // abaikan bila sudah disusul pemeriksaan lain
  }, []);

  const cekDariDaftar = useCallback(
    (k: string, t: string) => {
      setKartu(k);
      setTgl(t);
      void periksa(k, t, true);
    },
    [periksa],
  );

  const terverifikasiAlt = hasil.status === "done" && lolosAlt.has(kunciCek(hasil.kartu, hasil.tgl));

  return (
    <div className="grid content-start gap-4 p-4 sm:p-5 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <Card className={KARTU}>
          <CardHeader className="gap-0.5 px-4 pt-4">
            <CardTitle id={judulId} role="heading" aria-level={2} className="text-sm">
              Cek sidik jari
            </CardTitle>
            <CardDescription className="text-xs">Status validasi peserta pada tanggal pelayanan</CardDescription>
          </CardHeader>
          <div className="p-4">
            <CekKartuForm
              judulId={judulId}
              kartu={kartu}
              tgl={tgl}
              onKartu={setKartu}
              onTgl={setTgl}
              onSubmit={(k, t) => void periksa(k, t)}
              busy={hasil.status === "loading"}
              inputRef={inputRef}
              labelTombol="Cek sidik jari"
              ikonTombol={Fingerprint}
              sampel={SAMPLE_FINGERPRINT}
              catatan={
                <p className="flex items-start gap-2 rounded-xl bg-emerald-50/80 p-3 text-xs/relaxed text-emerald-950">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>
                    Sebelum SEP rawat jalan diterbitkan, V-Claim dapat meminta bukti peserta sudah validasi{" "}
                    <strong className="font-semibold">sidik jari</strong> pada hari pelayanan. Bila sidik jari tidak terbaca,
                    peserta bisa diverifikasi lewat <strong className="font-semibold">pertanyaan</strong>.
                  </span>
                </p>
              }
            />
          </div>
        </Card>

        <section ref={hasilRef} aria-label="Hasil cek sidik jari" className="min-w-0 scroll-mt-4">
          <FingerprintHasil
            hasil={hasil}
            terverifikasiAlt={terverifikasiAlt}
            bukaAlt={bukaAlt}
            altId={altId}
            judulRef={judulHasilRef}
            onToggleAlt={() => setBukaAlt((b) => !b)}
            onUlang={() => {
              if (hasil.status !== "idle") void periksa(hasil.kartu, hasil.tgl);
            }}
            onTerverifikasi={() => {
              if (hasil.status !== "done") return;
              setLolosAlt((s) => new Set(s).add(kunciCek(hasil.kartu, hasil.tgl)));
              setBukaAlt(false);
              requestAnimationFrame(() => judulHasilRef.current?.focus());
            }}
          />
        </section>
      </div>

      <Card className={KARTU}>
        <FingerprintList onCek={cekDariDaftar} onBukaSEP={onBukaSEP} />
      </Card>

      <p role="status" className="sr-only">
        {ringkas(hasil, terverifikasiAlt)}
      </p>
    </div>
  );
}
