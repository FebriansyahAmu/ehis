"use client";

// Tab Suplesi Jasa Raharja: kiri = form cek (No. kartu + tanggal pelayanan), kanan = hasil.
// Satu pemeriksaan menjalankan DUA panggilan V-Claim paralel (potensi suplesi + data induk
// kecelakaan) — masing-masing berdiri sendiri, jadi satu gagal tidak menyembunyikan yang lain.
// Respons basi (disusul pemeriksaan lain) diabaikan. Ringkasan hasil diumumkan lewat role="status".

import { useCallback, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dataIndukKecelakaan, suplesiCek } from "@/lib/bpjs/vClaimSEP";
import type { DataIndukKecelakaanItem, SuplesiJaminanItem } from "@/lib/bpjs/bpjsShared";
import { hariIniISO } from "./sepShared";
import CekKartuForm from "./CekKartuForm";
import SuplesiHasil, { ringkasSuplesi } from "./SuplesiHasil";
import { GALAT_KONEKSI, SAMPLE_KARTU, type Bagian, type HasilSuplesi } from "./suplesiShared";

async function cekPotensi(kartu: string, tgl: string): Promise<Bagian<SuplesiJaminanItem[]>> {
  try {
    const r = await suplesiCek(kartu, tgl);
    return r.ok ? { ok: true, data: r.value.response?.jaminan ?? [] } : { ok: false, error: r.error };
  } catch {
    return { ok: false, error: GALAT_KONEKSI };
  }
}

async function cekInduk(kartu: string): Promise<Bagian<DataIndukKecelakaanItem[]>> {
  try {
    const r = await dataIndukKecelakaan(kartu);
    return r.ok ? { ok: true, data: r.value.response?.list ?? [] } : { ok: false, error: r.error };
  } catch {
    return { ok: false, error: GALAT_KONEKSI };
  }
}

export default function SuplesiTab({ onBukaSEP }: { onBukaSEP?: (noSEP: string) => void }) {
  const judulId = useId();
  const [kartu, setKartu] = useState("");
  const [tgl, setTgl] = useState(hariIniISO);
  const [hasil, setHasil] = useState<HasilSuplesi>({ status: "idle" });
  const req = useRef(0);
  const terakhir = useRef<{ kartu: string; tgl: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const periksa = useCallback(async (k: string, t: string) => {
    const rid = ++req.current;
    terakhir.current = { kartu: k, tgl: t };
    setHasil({ status: "loading", kartu: k });
    const [potensi, induk] = await Promise.all([cekPotensi(k, t), cekInduk(k)]);
    if (rid !== req.current) return; // sudah disusul pemeriksaan lain
    setHasil({ status: "done", kartu: k, tgl: t, potensi, induk });
  }, []);

  const ulang = useCallback(() => {
    if (terakhir.current) void periksa(terakhir.current.kartu, terakhir.current.tgl);
  }, [periksa]);

  return (
    <div className="grid h-full content-start gap-4 p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className="min-w-0 gap-0 self-start border-0 py-0">
        <CardHeader className="gap-0.5 px-4 pt-4">
          <CardTitle id={judulId} role="heading" aria-level={2} className="text-sm">
            Suplesi Jasa Raharja
          </CardTitle>
          <CardDescription className="text-xs">Cek potensi suplesi & riwayat kecelakaan peserta</CardDescription>
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
            labelTombol="Periksa kecelakaan"
            sampel={SAMPLE_KARTU}
            catatan={
              <p className="flex items-start gap-2 rounded-xl bg-amber-50/80 p-3 text-xs/relaxed text-amber-950">
                <Info className="mt-0.5 size-3.5 shrink-0 text-amber-700" aria-hidden="true" />
                <span>
                  Jasa Raharja menjamin biaya perawatan kecelakaan lalu lintas sampai{" "}
                  <strong className="font-semibold">Rp 20 juta</strong>. Sisanya dijamin BPJS lewat{" "}
                  <strong className="font-semibold">SEP suplesi</strong> yang merujuk SEP kecelakaan awal.
                </span>
              </p>
            }
          />
        </div>
      </Card>

      <section aria-label="Hasil pemeriksaan suplesi" className="min-w-0">
        <SuplesiHasil hasil={hasil} onUlang={ulang} onBukaSEP={onBukaSEP} />
      </section>

      <p role="status" className="sr-only">
        {ringkasSuplesi(hasil)}
      </p>
    </div>
  );
}
