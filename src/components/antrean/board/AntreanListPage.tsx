"use client";

// ANT2 — Tab Antrean List (board loket admisi). Orkestrator: panel loket + ringkasan + saringan +
// tabel + Sheet detail + Sheet riwayat shift + dialog batal. Reaktif dari antreanStore & loketStore.
// Redesign shadcn (2026-11-27): kartu tanpa garis, aksen emerald, tombol xs/sm, dropdown Select
// shadcn (pos/loket/jenis/poli/sumber), urutan FIFO waktu ambil antrean + lama tunggu berdetak,
// "Panggil berikutnya" & pasien yang sedang dipanggil di panel loket, umpan balik lewat toast global.
// Aksi ditekan saat loket tertutup → petugas diarahkan ke form Buka loket (fokus ke dropdown Pos).

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { ListChecks, MonitorPlay, MonitorSmartphone, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { KepalaKartu, KosongData, SaringKosong, UbinAngka } from "@/components/bpjs/shared/daftarUi";
import { KARTU, KolomSaring, SegmenFilter, type OpsiSegmen } from "@/components/bpjs/shared/vclaimUi";
import { useSkeletonDelay } from "@/components/master/shared";
import { PasienBaruModal, type PasienBaruPrefill } from "@/components/registration/pasien-baru/PasienBaruModal";
import { cn } from "@/lib/ui/utils";
import { toast } from "@/lib/ui/toastStore";
import { batalAntrean, emitTask, seedAntrean, setStatus as setStatusAntrean, useAntreanStore } from "@/lib/antrean/antreanStore";
import { buildSeedAntrean } from "@/lib/antrean/antreanSeed";
import { getPoli } from "@/lib/antrean/onsiteMock";
import { logBatal, logRespon, recordPanggil, recordPanggilUlang, useLoketStore } from "@/lib/antrean/loketStore";
import type { AntreanRecord, AntreanStatus, SumberAntrean } from "@/lib/antrean/types";
import { AntreanTable, type AksiBaris } from "./AntreanTable";
import AntreanSheet from "./AntreanSheet";
import { BatalModal, type BatalMode } from "./BatalModal";
import { ITEM_SELECT, LoketControlBar, PEMICU_SELECT } from "./LoketControlBar";
import ShiftLogSheet from "./ShiftLogSheet";
import { STATUS_FILTERS, SUMBER_LABEL, cocokStatus, fmtDurasi, menitSejak, useSekarang, type KunciSaringStatus } from "./boardShared";

type SaringSumber = "semua" | SumberAntrean;

const STATUS_KE_LAYANAN: readonly AntreanStatus[] = ["MenungguPoli", "DilayaniPoli", "MenungguFarmasi", "Selesai"];

/** Deep-link ke dashboard pasien + auto-buka Daftar Kunjungan RJ (ANT4). */
function daftarKunjunganUrl(noRM: string, kodebooking: string): string {
  return `/ehis-registration/pasien/${encodeURIComponent(noRM)}?daftar=rj&kodebooking=${encodeURIComponent(kodebooking)}`;
}

/** Prefill PasienBaruModal dari data antrean walk-in (kiosk). */
function prefillFromAntrean(rec: AntreanRecord): PasienBaruPrefill {
  return {
    nik: rec.pasien.nik,
    nama: rec.pasien.nama,
    tglLahir: rec.pasien.tglLahir,
    noHp: rec.pasien.kontak,
    penjamin:
      rec.caraBayar === "BPJS" ? { tipe: "BPJS_Non_PBI", nama: "BPJS Kesehatan Non-PBI", nomor: rec.noKartu } : undefined,
  };
}

function namaPoli(a: AntreanRecord): string {
  return a.kodepoli ? (getPoli(a.kodepoli)?.nama ?? a.poli) : a.poli;
}

export function AntreanListPage() {
  const id = useId();
  const router = useRouter();
  const antrean = useAntreanStore();
  const loket = useLoketStore();
  const loaded = useSkeletonDelay(500);
  const sekarang = useSekarang();

  const [status, setSaringStatus] = useState<KunciSaringStatus>("semua");
  const [poli, setPoli] = useState("semua");
  const [sumber, setSumber] = useState<SaringSumber>("semua");
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState<{ kode: string; buka: boolean } | null>(null);
  const [batal, setBatal] = useState<{ kode: string; buka: boolean; n: number } | null>(null);
  const [riwayat, setRiwayat] = useState(false);
  const [pasienBaruFor, setPasienBaruFor] = useState<AntreanRecord | null>(null);
  const pilihPosRef = useRef<HTMLButtonElement>(null);
  /** Dijalankan saat Sheet detail selesai menutup, menggantikan kembalinya fokus ke pemicu. */
  const sesudahSheet = useRef<(() => void) | null>(null);

  // Seed contoh saat store kosong → board punya data untuk menampilkan layout.
  useEffect(() => {
    seedAntrean(buildSeedAntrean());
  }, []);

  const session = loket.session;
  const jenisSesi = session && session.jenisPasien !== "Semua" ? session.jenisPasien : null;

  // Urut FIFO: yang lebih dulu mengambil antrean di atas (lintas poli).
  const semua = useMemo(
    () => Object.values(antrean.byKode).toSorted((a, b) => a.createdAt - b.createdAt || a.angkaAntrean - b.angkaAntrean),
    [antrean.byKode],
  );
  const base = jenisSesi ? semua.filter((a) => a.jenisPasien === jenisSesi) : semua;

  // ── Saringan ───────────────────────────────────────────

  const opsiPoli = [...new Map(base.map((a) => [a.kodepoli ?? a.poli, namaPoli(a)])).entries()]
    .map(([value, label]) => ({ value, label }))
    .toSorted((a, b) => a.label.localeCompare(b.label, "id"));
  const poliAktif = opsiPoli.some((o) => o.value === poli) ? poli : "semua";

  const kata = q.trim().toLowerCase();
  const praStatus = base.filter((a) => {
    if (poliAktif !== "semua" && (a.kodepoli ?? a.poli) !== poliAktif) return false;
    if (sumber !== "semua" && a.sumber !== sumber) return false;
    if (!kata) return true;
    const hay = [a.nomorAntrean, a.kodebooking, a.pasien.nama, a.pasien.noRM, a.pasien.nik, a.noKartu, a.dokter, namaPoli(a)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(kata);
  });
  const opsiStatus: OpsiSegmen<KunciSaringStatus>[] = STATUS_FILTERS.map((f) => ({
    value: f.key,
    label: f.label,
    jumlah: praStatus.filter((a) => cocokStatus(a.status, f.key)).length,
  }));
  const rows = praStatus.filter((a) => cocokStatus(a.status, status));
  const adaSaring = status !== "semua" || poliAktif !== "semua" || sumber !== "semua" || kata !== "";

  function resetSaring() {
    setSaringStatus("semua");
    setPoli("semua");
    setSumber("semua");
    setQ("");
  }

  // ── Ringkasan ──────────────────────────────────────────

  const menunggu = base.filter((a) => a.status === "MenungguAdmisi");
  const terlama = menunggu.reduce((m, a) => Math.max(m, menitSejak(a.createdAt, sekarang)), 0);
  const dipanggilSemua = base.filter((a) => a.status === "DipanggilAdmisi");
  const dipanggilUlang = dipanggilSemua.filter((a) => (loket.panggilan[a.kodebooking]?.recalls ?? 0) > 0).length;
  const keLayanan = base.filter((a) => STATUS_KE_LAYANAN.includes(a.status)).length;
  const dibatalkan = base.filter((a) => a.status === "Batal" || a.status === "TidakHadir").length;
  const online = base.filter((a) => a.sumber !== "Onsite").length;

  // ── Panel loket ────────────────────────────────────────

  const dipanggil = session
    ? (dipanggilSemua
        .filter((a) => {
          const r = loket.panggilan[a.kodebooking];
          return r?.pos === session.pos && r?.loket === session.loket;
        })
        .toSorted((a, b) => (loket.panggilan[b.kodebooking]?.calledAt ?? 0) - (loket.panggilan[a.kodebooking]?.calledAt ?? 0))[0] ?? null)
    : null;
  const berikutnya = menunggu[0] ?? null;

  // ── Aksi ───────────────────────────────────────────────

  function fokusBukaLoket() {
    const el = pilihPosRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.focus();
  }

  /** Tutup Sheet detail bila terbuka; `lanjut` menggantikan kembalinya fokus ke pemicu Sheet. */
  function tutupSheet(lanjut: () => void = () => {}) {
    if (sheet?.buka) {
      sesudahSheet.current = lanjut;
      setSheet({ ...sheet, buka: false });
    } else {
      lanjut();
    }
  }

  function perluLoket() {
    toast.info("Buka loket dahulu", "Pilih pos dan loket tempat Anda bertugas, lalu tekan Buka loket.");
    tutupSheet(() => requestAnimationFrame(fokusBukaLoket));
  }

  function handlePanggil(rec: AntreanRecord) {
    if (!session) return perluLoket();
    setStatusAntrean(rec.kodebooking, "DipanggilAdmisi");
    recordPanggil(rec.kodebooking, rec.nomorAntrean);
    toast.success(`Memanggil ${rec.nomorAntrean}`, rec.pasien.nama);
  }

  // Panggil ulang: pasien sudah dipanggil tapi belum hadir → ulangi panggilan.
  function handlePanggilUlang(rec: AntreanRecord) {
    if (!session) return perluLoket();
    const n = recordPanggilUlang(rec.kodebooking, rec.nomorAntrean);
    toast.info(`Panggil ulang ${rec.nomorAntrean}`, `Panggilan ke-${n + 1} · ${rec.pasien.nama}`);
  }

  // ANT4 — Respon Kedatangan mencabang berdasarkan ada/tidaknya No. RM.
  function handleRespon(rec: AntreanRecord) {
    if (!session) return perluLoket();
    logRespon(rec.kodebooking, rec.pasien.nama);
    const norm = rec.pasien.noRM;
    if (norm) {
      // Lama → T3 (check-in). Baru-online (sudah punya norm) → T1 lalu T2.
      if (rec.jenisPasien === "Lama") {
        emitTask(rec.kodebooking, 3);
      } else {
        emitTask(rec.kodebooking, 1);
        emitTask(rec.kodebooking, 2);
      }
      tutupSheet();
      router.push(daftarKunjunganUrl(norm, rec.kodebooking));
      return;
    }
    // Walk-in murni (belum punya norm) → daftar pasien baru dulu.
    tutupSheet();
    setPasienBaruFor(rec);
  }

  // Walk-in selesai didaftarkan → terbit norm → T1+T2 → lanjut Daftar Kunjungan RJ.
  function handlePasienBaruSuccess(noRM: string) {
    const rec = pasienBaruFor;
    setPasienBaruFor(null);
    if (!rec) return;
    emitTask(rec.kodebooking, 1);
    emitTask(rec.kodebooking, 2);
    router.push(daftarKunjunganUrl(noRM, rec.kodebooking));
  }

  function handleBatal(rec: AntreanRecord) {
    if (!session) return perluLoket();
    tutupSheet();
    setBatal((b) => ({ kode: rec.kodebooking, buka: true, n: (b?.n ?? 0) + 1 }));
  }

  function handleBatalConfirm(rec: AntreanRecord, mode: BatalMode, alasan: string) {
    batalAntrean(rec.kodebooking, mode === "TidakHadir" ? "TidakHadir" : "Batal");
    logBatal(rec.nomorAntrean, alasan);
    toast.success(`${rec.nomorAntrean} dibatalkan`, `${mode === "TidakHadir" ? "Tidak hadir" : "Batal"} · task 99 dikirim ke Antrol`);
    setBatal((b) => (b ? { ...b, buka: false } : b));
  }

  const aksi: AksiBaris = {
    onDetail: (rec) => setSheet({ kode: rec.kodebooking, buka: true }),
    onPanggil: handlePanggil,
    onPanggilUlang: handlePanggilUlang,
    onRespon: handleRespon,
    onBatal: handleBatal,
    onPerluLoket: perluLoket,
  };

  const recSheet = sheet ? (antrean.byKode[sheet.kode] ?? null) : null;
  const recBatal = batal ? (antrean.byKode[batal.kode] ?? null) : null;

  if (!loaded) return <Kerangka />;

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex flex-col gap-4 p-4 text-foreground sm:p-5">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ListChecks className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Antrean list</h1>
            <p className="text-xs text-muted-foreground">Board loket admisi rawat jalan — antrean kiosk APM dan Mobile JKN hari ini</p>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="xs">
              <Link href="/ehis-antrian/display" target="_blank" rel="noopener">
                <MonitorPlay aria-hidden="true" />
                Layar display
                <span className="sr-only"> (tab baru)</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="xs">
              <Link href="/ehis-antrian/apm" target="_blank" rel="noopener">
                <MonitorSmartphone aria-hidden="true" />
                Kiosk APM
                <span className="sr-only"> (tab baru)</span>
              </Link>
            </Button>
          </div>
        </header>

        <LoketControlBar
          session={session}
          shiftLogCount={loket.shiftLog.length}
          dipanggil={dipanggil}
          dipanggilRef={dipanggil ? loket.panggilan[dipanggil.kodebooking] : undefined}
          berikutnya={berikutnya}
          jumlahMenunggu={menunggu.length}
          pilihPosRef={pilihPosRef}
          onPanggil={handlePanggil}
          onPanggilUlang={handlePanggilUlang}
          onRespon={handleRespon}
          onBukaRiwayat={() => setRiwayat(true)}
        />

        <Card className={KARTU}>
          <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
            <KepalaKartu
              judulId={`${id}-judul`}
              judul="Daftar antrean"
              deskripsi={
                jenisSesi
                  ? `Hanya pasien ${jenisSesi.toLowerCase()} sesuai sesi loket · yang paling lama menunggu di atas`
                  : "Urut waktu ambil antrean — yang paling lama menunggu di atas"
              }
            />

            {semua.length === 0 ? (
              <KosongData
                ikon={Ticket}
                judul="Belum ada antrean hari ini"
                deskripsi="Antrean dari kiosk APM dan Mobile JKN tampil di sini begitu pasien mengambil nomor."
              >
                <Button asChild size="xs" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Link href="/ehis-antrian/apm" target="_blank" rel="noopener">
                    <MonitorSmartphone aria-hidden="true" />
                    Buka kiosk APM
                    <span className="sr-only"> (tab baru)</span>
                  </Link>
                </Button>
              </KosongData>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4">
                  <UbinAngka label="Antrean hari ini" nilai={base.length} ket={`${base.length - online} kiosk · ${online} online`} />
                  <UbinAngka
                    label="Menunggu admisi"
                    nilai={menunggu.length}
                    nada={terlama >= 60 ? "rose" : menunggu.length > 0 ? "amber" : undefined}
                    ket={menunggu.length > 0 ? `terlama ${fmtDurasi(terlama)}` : "tidak ada yang menunggu"}
                  />
                  <UbinAngka
                    label="Dipanggil"
                    nilai={dipanggilSemua.length}
                    ket={dipanggilUlang > 0 ? `${dipanggilUlang} sudah dipanggil ulang` : "menunggu pasien datang"}
                  />
                  <UbinAngka
                    label="Diteruskan ke poli"
                    nilai={keLayanan}
                    nada={keLayanan > 0 ? "emerald" : undefined}
                    ket={dibatalkan > 0 ? `${dibatalkan} batal / tidak hadir` : "tanpa pembatalan"}
                  />
                </dl>

                <div className="px-4">
                  <SegmenFilter label="Saring status antrean" opsi={opsiStatus} value={status} onChange={setSaringStatus} />
                </div>
                <div className="flex flex-wrap items-center gap-2 px-4">
                  <KolomSaring
                    id={`${id}-q`}
                    value={q}
                    onChange={setQ}
                    label="Cari nama, No. RM, NIK, atau nomor antrean"
                    placeholder="Cari nama, No. RM, NIK, atau nomor antrean"
                  />
                  <Select value={poliAktif} onValueChange={setPoli}>
                    <SelectTrigger size="sm" aria-label="Saring poli" className={cn(PEMICU_SELECT, "w-full sm:w-44")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="end">
                      <SelectItem value="semua" className={ITEM_SELECT}>
                        Semua poli
                      </SelectItem>
                      {opsiPoli.map((o) => (
                        <SelectItem key={o.value} value={o.value} className={ITEM_SELECT}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sumber} onValueChange={(v) => setSumber(v as SaringSumber)}>
                    <SelectTrigger size="sm" aria-label="Saring sumber antrean" className={cn(PEMICU_SELECT, "w-full sm:w-40")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="end">
                      <SelectItem value="semua" className={ITEM_SELECT}>
                        Semua sumber
                      </SelectItem>
                      {(Object.keys(SUMBER_LABEL) as SumberAntrean[]).map((s) => (
                        <SelectItem key={s} value={s} className={ITEM_SELECT}>
                          {SUMBER_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="px-2">
                  {rows.length === 0 ? (
                    <SaringKosong
                      pesan={
                        kata ? (
                          <>
                            Tidak ada antrean yang cocok dengan “<span className="text-foreground">{q.trim()}</span>”
                          </>
                        ) : (
                          "Tidak ada antrean dengan saringan ini"
                        )
                      }
                      onReset={resetSaring}
                    />
                  ) : (
                    <AntreanTable
                      rows={rows}
                      caption="Daftar antrean loket admisi"
                      session={session}
                      panggilan={loket.panggilan}
                      sekarang={sekarang}
                      aksi={aksi}
                    />
                  )}
                </div>
              </>
            )}

            <p role="status" className="sr-only">
              {semua.length > 0 && adaSaring ? `${rows.length} antrean ditampilkan` : ""}
            </p>
          </section>
        </Card>

        <AntreanSheet
          rec={recSheet}
          open={Boolean(sheet?.buka)}
          session={session}
          panggilanRef={recSheet ? loket.panggilan[recSheet.kodebooking] : undefined}
          sekarang={sekarang}
          onClose={() => setSheet((s) => (s ? { ...s, buka: false } : s))}
          onCloseAutoFocus={(e) => {
            const lanjut = sesudahSheet.current;
            if (!lanjut) return; // ditutup biasa → fokus kembali ke pemicu (bawaan Radix)
            e.preventDefault();
            sesudahSheet.current = null;
            lanjut();
          }}
          aksi={aksi}
        />

        <ShiftLogSheet open={riwayat} onOpenChange={setRiwayat} log={loket.shiftLog} />

        {batal && recBatal && (
          <BatalModal
            key={batal.n}
            record={recBatal}
            open={batal.buka}
            onOpenChange={(o) => setBatal((b) => (b ? { ...b, buka: o } : b))}
            saranTidakHadir={recBatal.status === "DipanggilAdmisi" && (loket.panggilan[recBatal.kodebooking]?.recalls ?? 0) > 0}
            onConfirm={(mode, alasan) => handleBatalConfirm(recBatal, mode, alasan)}
          />
        )}

        {/* ANT4 — walk-in murni: daftar pasien baru dulu, lalu lanjut Daftar Kunjungan RJ */}
        <PasienBaruModal
          open={pasienBaruFor !== null}
          prefill={pasienBaruFor ? prefillFromAntrean(pasienBaruFor) : undefined}
          onClose={() => setPasienBaruFor(null)}
          onSuccess={handlePasienBaruSuccess}
        />
      </div>
    </MotionConfig>
  );
}

function Kerangka() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-17 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-7 w-96 max-w-full" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-13 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
