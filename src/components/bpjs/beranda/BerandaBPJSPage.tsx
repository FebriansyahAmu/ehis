"use client";

// BP1 Beranda BPJS. Dulu: KPI dari data contoh statis (bulan Mei), status "LZ-String" (pustaka
// kompresi, bukan layanan) dan "Aplicares degraded" yang TERTULIS di kode, tombol "Sync" yang hanya
// berputar 1,2 detik, panel referensi berisi 6 cache karangan, tombol "Refresh semua" yang justru
// MENGOSONGKAN cache, dan pilihan "auto-sync" yang tidak tersimpan. Kini semuanya diturunkan dari data:
// • Koneksi web service per layanan — dari log panggilan (jejak 20 panggilan terakhir);
// • Perlu ditindaklanjuti — sambungan putus/goyah, laporan kamar belum terkini, ruangan ditutup,
//   panggilan gagal/lambat hari ini; tiap baris satu aksi kecil (tautan Audit trail sudah tersaring);
// • Tempat tidur yang dilaporkan ke Aplicares (GET /bed/read) per kelas, + "Muat ulang";
// • Panggilan terbaru (live) → Sheet detail; menu semua halaman modul.
// Komponen shadcn: Card · Item · Badge · Button · Skeleton · Empty · Alert · Sheet.

import { useEffect, useState, useSyncExternalStore } from "react";
import { MotionConfig } from "framer-motion";
import { RotateCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkeletonDelay } from "@/components/master/shared";
import { keISO } from "@/components/bpjs/shared/tanggal";
import { useSekarang } from "@/components/bpjs/aplicares/ketersediaanShared";
import { cn } from "@/lib/ui/utils";
import { listKamar } from "@/lib/bpjs/aplicaresAdapter";
import { getAuditEntries, subscribeAudit } from "@/lib/bpjs/auditStore";
import type { AplicaresKamarRecord, BPJSAuditEntry, BPJSError } from "@/lib/bpjs/bpjsShared";
import { seedAuditTrailMock } from "@/lib/bpjs/mock/auditTrailMock";
import { LAYANAN, daftarTugas, ringkasKamar, ringkasLayanan } from "./berandaShared";
import KartuKoneksi from "./KartuKoneksi";
import KartuPanggilan from "./KartuPanggilan";
import KartuTempatTidur from "./KartuTempatTidur";
import KartuTugas from "./KartuTugas";
import MenuBPJS from "./MenuBPJS";

type HasilKamar = { kunci: number; waktu: number } & ({ ok: true; list: AplicaresKamarRecord[] } | { ok: false; error: BPJSError });

const KOSONG: readonly BPJSAuditEntry[] = [];
const GALAT_SAMBUNGAN: BPJSError = { type: "NetworkError", message: "Koneksi ke Aplicares gagal", retryable: true };

export default function BerandaBPJSPage() {
  const siap = useSkeletonDelay(400);
  const log = useSyncExternalStore(subscribeAudit, getAuditEntries, () => KOSONG);
  const sekarang = useSekarang();
  const [muat, setMuat] = useState(0);
  const [hasil, setHasil] = useState<HasilKamar | null>(null);
  const memuatKamar = hasil?.kunci !== muat;

  // Data uji audit sekali per sesi (idempoten) — panggilan nyata dari adapter tercatat di store yang sama.
  useEffect(() => {
    seedAuditTrailMock();
  }, []);

  useEffect(() => {
    let batal = false;
    listKamar()
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci: muat, waktu: Date.now(), ok: true, list: res.value.response ?? [] } : { kunci: muat, waktu: Date.now(), ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci: muat, waktu: Date.now(), ok: false, error: GALAT_SAMBUNGAN });
      });
    return () => {
      batal = true;
    };
  }, [muat]);

  const urut = log.toSorted((a, b) => b.timestamp.localeCompare(a.timestamp));
  const hariIni = keISO(new Date(sekarang));
  const layanan = LAYANAN.map((l) => ringkasLayanan(urut, l.nama, hariIni));
  // Hasil lama tetap tampil selama memuat ulang (belum diganti); galat disembunyikan saat mencoba lagi.
  const kamarOk = hasil?.ok ? hasil : null;
  const kamar = kamarOk ? ringkasKamar(kamarOk.list, sekarang) : null;
  const galatKamar = hasil && !hasil.ok && !memuatKamar ? hasil.error : null;
  const tugas = daftarTugas({ layanan, kamar, log: urut, hariIni, sekarang });
  const ulangKamar = () => setMuat((n) => n + 1);

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex flex-col gap-4 p-4 text-foreground sm:p-5">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0 flex-1 basis-60">
            <h1 className="text-sm font-semibold">Beranda BPJS</h1>
            <p className="text-xs text-muted-foreground">Koneksi web service, hal yang perlu ditindaklanjuti, dan aktivitas V-Claim serta Aplicares</p>
          </div>
          <div className="flex items-center gap-2">
            {kamarOk && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                Data kamar dimuat{" "}
                <time dateTime={new Date(kamarOk.waktu).toISOString()}>
                  {new Date(kamarOk.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </time>
              </span>
            )}
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                if (!memuatKamar) ulangKamar();
              }}
              aria-disabled={memuatKamar}
              className="bg-white shadow-xs aria-disabled:cursor-wait aria-disabled:opacity-60"
            >
              <RotateCw aria-hidden="true" className={cn(memuatKamar && "animate-spin motion-reduce:animate-none")} />
              Muat ulang<span className="sr-only"> data tempat tidur Aplicares</span>
            </Button>
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <KartuKoneksi siap={siap} layanan={layanan} sekarang={sekarang} />
            <KartuTugas siap={siap} tugas={tugas} kamarSiap={hasil !== null} memuatKamar={memuatKamar} onUlangKamar={ulangKamar} />
            <KartuPanggilan siap={siap} log={urut} sekarang={sekarang} />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <KartuTempatTidur siap={siap} memuat={memuatKamar} kamar={kamar} error={galatKamar} onUlang={ulangKamar} />
            <MenuBPJS />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
