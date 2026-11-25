"use client";

// Detail satu ruang rawat di Sheet shadcn dari kanan: komposisi tempat tidur (terisi · tersedia ·
// tidak siap) + bilah keterisian, kapan laporan terakhir DIKIRIM ke Aplicares, lalu:
// • ruangan buka → form "Laporkan ketersediaan": tempat tidur tersedia (penggeser −/+, maks =
//   kapasitas − terisi) + rincian per jenis kelamin opsional (jumlahnya harus sama dengan
//   tersedia); galat sesudah kolom ditinggal / saat kirim (fokus ke kolom salah pertama);
// • ruangan ditutup → alasan + sejak kapan + "Buka kembali" (tersedia dipulihkan ke nilai
//   sebelum ditutup, BUKAN kapasitas penuh).
// "Tutup sementara" membuka dialog konfirmasi di atas Sheet. Kapasitas tidak diubah di sini —
// sumbernya master ruangan.
// Komponen shadcn: Sheet · Badge · Button · Input · Collapsible · Alert · Spinner.

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, ChevronDown, DoorClosed, DoorOpen, Minus, Plus, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { DOT } from "@/components/bpjs/shared/badge";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { UbinAngka } from "@/components/bpjs/shared/daftarUi";
import { LabelWajib, PesanGalat } from "@/components/bpjs/shared/formUi";
import { fmtWaktu } from "@/components/bpjs/shared/tanggal";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { BadgeNada, GalatVClaim, Meter } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { GOLONGAN_KELAS, golonganKelas, kelasBPJSLabel, nadaKeterisian } from "./aplicaresShared";
import {
  KOLOM_RINCI,
  LABEL_RINCI,
  LABEL_STATUS,
  keNilai,
  kesegaran,
  maksTersedia,
  statusRuang,
  teksAwal,
  tidakSiap,
  validasiLaporan,
  waktuRelatif,
  type BarisRuang,
  type KolomLaporan,
  type NilaiLaporan,
  type TeksLaporan,
} from "./ketersediaanShared";
import TutupRuangDialog from "./TutupRuangDialog";

const INPUT_ANGKA =
  "h-8 rounded-lg border-0 bg-slate-100 text-center text-xs tabular-nums shadow-none focus-visible:bg-white focus-visible:ring-ring/40 aria-invalid:bg-rose-50 md:text-xs";

type Kirim = { status: "diam" } | { status: "proses" } | { status: "ok"; waktu: string } | { status: "gagal"; error: BPJSError };

function FormLaporan({ r, onKirim }: { r: BarisRuang; onKirim: (nilai: NilaiLaporan) => Promise<BPJSError | null> }) {
  const id = useId();
  const [teks, setTeks] = useState<TeksLaporan>(() => teksAwal(r));
  const [disentuh, setDisentuh] = useState<ReadonlySet<KolomLaporan>>(() => new Set());
  const [coba, setCoba] = useState(false);
  const [rinciBuka, setRinciBuka] = useState(() => KOLOM_RINCI.some((k) => teks[k] !== ""));
  const [kirim, setKirim] = useState<Kirim>({ status: "diam" });
  const { teks: pengumuman, umumkan, bersihkan } = useUmumkanGalat();
  const tersediaRef = useRef<HTMLInputElement>(null);
  const rinciRef = useRef<Record<string, HTMLInputElement | null>>({});

  const maks = maksTersedia(r);
  const galat = validasiLaporan(teks, r);
  const rinciDisentuh = KOLOM_RINCI.some((k) => disentuh.has(k));
  const tampil = (k: KolomLaporan) => (coba || disentuh.has(k) ? galat[k] : undefined);
  const galatRinci = coba || rinciDisentuh ? galat.rinci : undefined;
  const nilaiTersedia = /^\d+$/.test(teks.tersedia.trim()) ? Number(teks.tersedia.trim()) : null;

  function ubah(k: KolomLaporan, v: string) {
    setTeks((t) => ({ ...t, [k]: v }));
    if (kirim.status === "ok" || kirim.status === "gagal") setKirim({ status: "diam" });
  }

  function tinggalkan(k: KolomLaporan) {
    setDisentuh((s) => new Set(s).add(k));
    const pesan = galat[k] ?? (k !== "tersedia" ? galat.rinci : undefined);
    if (pesan) umumkan(pesan, k);
    else bersihkan(k);
  }

  function geser(langkah: number) {
    const awal = nilaiTersedia ?? 0;
    const baru = Math.min(Math.max(awal + langkah, 0), maks);
    ubah("tersedia", String(baru));
    setDisentuh((s) => new Set(s).add("tersedia"));
  }

  async function kirimLaporan(e: FormEvent) {
    e.preventDefault();
    if (kirim.status === "proses") return;
    setCoba(true);
    if (galat.tersedia) {
      tersediaRef.current?.focus();
      return;
    }
    const rinciSalah = KOLOM_RINCI.find((k) => galat[k]) ?? (galat.rinci ? KOLOM_RINCI[0] : undefined);
    if (rinciSalah) {
      setRinciBuka(true);
      requestAnimationFrame(() => rinciRef.current[rinciSalah]?.focus());
      return;
    }
    setKirim({ status: "proses" });
    const err = await onKirim(keNilai(teks));
    setKirim(err ? { status: "gagal", error: err } : { status: "ok", waktu: new Date().toISOString() });
  }

  const idBantuTersedia = `${id}-tersedia-bantu`;
  const galatTersedia = tampil("tersedia");

  return (
    <form onSubmit={kirimLaporan} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <LabelWajib htmlFor={`${id}-tersedia`}>Tempat tidur tersedia</LabelWajib>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            aria-label="Kurangi satu"
            aria-controls={`${id}-tersedia`}
            aria-disabled={nilaiTersedia === null || nilaiTersedia <= 0}
            onClick={() => geser(-1)}
            className="size-8 rounded-lg aria-disabled:opacity-40"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </Button>
          <Input
            ref={tersediaRef}
            id={`${id}-tersedia`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="send"
            value={teks.tersedia}
            onChange={(e) => ubah("tersedia", e.target.value)}
            onBlur={() => tinggalkan("tersedia")}
            aria-invalid={Boolean(galatTersedia)}
            aria-describedby={`${idBantuTersedia}${galatTersedia ? ` ${id}-tersedia-galat` : ""}`}
            className={cn(INPUT_ANGKA, "w-20")}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            aria-label="Tambah satu"
            aria-controls={`${id}-tersedia`}
            aria-disabled={nilaiTersedia !== null && nilaiTersedia >= maks}
            onClick={() => geser(1)}
            className="size-8 rounded-lg aria-disabled:opacity-40"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={() => ubah("tersedia", String(maks))} className="ml-1 text-emerald-700">
            Isi {maks}
            <span className="sr-only"> (semua tempat tidur yang tidak terisi)</span>
          </Button>
        </div>
        <p id={idBantuTersedia} className="text-[11px] text-muted-foreground tabular-nums">
          Paling banyak {maks}: kapasitas {r.kapasitas} dikurangi {r.terisi} terisi
        </p>
        {galatTersedia && <PesanGalat id={`${id}-tersedia-galat`}>{galatTersedia}</PesanGalat>}
      </div>

      <Collapsible open={rinciBuka} onOpenChange={setRinciBuka} className="rounded-xl bg-slate-50">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="group h-auto w-full justify-start gap-1.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-transparent">
            <span className="flex-1 text-left">
              Rincian per jenis kelamin <span className="font-normal text-muted-foreground">(opsional)</span>
            </span>
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <fieldset className="flex flex-col gap-2 px-3 pb-3" aria-describedby={`${id}-rinci-bantu${galatRinci ? ` ${id}-rinci-galat` : ""}`}>
            <legend className="sr-only">Rincian tempat tidur tersedia per jenis kelamin</legend>
            <p id={`${id}-rinci-bantu`} className="text-[11px] text-muted-foreground">
              Untuk RS yang memisahkan kamar laki-laki dan perempuan. Bila diisi, jumlah ketiganya harus sama dengan tempat tidur tersedia.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {KOLOM_RINCI.map((k) => {
                const g = tampil(k);
                return (
                  <div key={k} className="flex min-w-0 flex-col gap-1">
                    <Label htmlFor={`${id}-${k}`} className="text-[11px] leading-tight font-normal text-muted-foreground">
                      {LABEL_RINCI[k]}
                    </Label>
                    <Input
                      ref={(el) => {
                        rinciRef.current[k] = el;
                      }}
                      id={`${id}-${k}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={teks[k]}
                      onChange={(e) => ubah(k, e.target.value)}
                      onBlur={() => tinggalkan(k)}
                      aria-invalid={Boolean(g || galatRinci)}
                      aria-describedby={g ? `${id}-${k}-galat` : undefined}
                      placeholder="0"
                      className={cn(INPUT_ANGKA, "bg-white")}
                    />
                    {g && <PesanGalat id={`${id}-${k}-galat`}>{g}</PesanGalat>}
                  </div>
                );
              })}
            </div>
            {galatRinci && <PesanGalat id={`${id}-rinci-galat`}>{galatRinci}</PesanGalat>}
          </fieldset>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={kirim.status === "proses"} className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
          {kirim.status === "proses" ? (
            <>
              <Spinner className="size-3.5" aria-hidden="true" />
              Mengirim…
            </>
          ) : (
            <>
              <Send className="size-3.5" aria-hidden="true" />
              Kirim ke Aplicares
            </>
          )}
        </Button>
        <span className="text-[11px] text-muted-foreground">Kapasitas {r.kapasitas} ikut dikirim dari master ruangan</span>
      </div>

      <p role="status" className="sr-only">
        {kirim.status === "ok" ? `Laporan ${r.namaRuang} terkirim ke Aplicares` : kirim.status === "gagal" ? "Laporan gagal dikirim" : ""}
      </p>
      <p aria-live="polite" className="sr-only">
        {pengumuman}
      </p>
      {kirim.status === "ok" && (
        <Alert className="rounded-xl border-0 bg-emerald-50 p-3 text-emerald-900 has-[>svg]:gap-x-2 [&>svg]:size-4" role="note">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle className="text-xs font-semibold">Terkirim ke Aplicares</AlertTitle>
          <AlertDescription className="text-xs text-emerald-900 tabular-nums">
            {nilaiTersedia ?? 0} tempat tidur tersedia dilaporkan pukul {fmtWaktu(kirim.waktu)}
          </AlertDescription>
        </Alert>
      )}
      {kirim.status === "gagal" && <GalatVClaim error={kirim.error} objek="Ruang" layanan="Aplicares" />}
    </form>
  );
}

function BlokTutup({ r, onBukaKembali }: { r: BarisRuang; onBukaKembali: () => Promise<BPJSError | null> }) {
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<BPJSError | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 rounded-xl bg-rose-50 p-3 text-xs/relaxed text-rose-950">
        <p className="font-semibold">Ditutup sementara — dilaporkan 0 tempat tidur tersedia</p>
        {r.tutup ? (
          <>
            <p className="tabular-nums">Sejak {fmtWaktu(r.tutup.sejak)}</p>
            <p>Alasan: {r.tutup.alasan}</p>
          </>
        ) : (
          <p>Status tutup berasal dari data ruangan (semua tempat tidur dalam perawatan).</p>
        )}
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          disabled={proses}
          onClick={async () => {
            setProses(true);
            setGalat(null);
            const err = await onBukaKembali();
            setProses(false);
            if (err) setGalat(err);
          }}
          className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
        >
          {proses ? <Spinner className="size-3.5" aria-hidden="true" /> : <DoorOpen className="size-3.5" aria-hidden="true" />}
          {proses ? "Membuka…" : "Buka kembali"}
        </Button>
      </div>
      {galat && <GalatVClaim error={galat} objek="Ruang" layanan="Aplicares" />}
    </div>
  );
}

export default function RuangSheet({
  ruang,
  open,
  sekarang,
  onClose,
  onKirim,
  onTutup,
  onBukaKembali,
}: {
  ruang: BarisRuang | null;
  open: boolean;
  sekarang: number;
  onClose: () => void;
  onKirim: (r: BarisRuang, nilai: NilaiLaporan) => Promise<BPJSError | null>;
  onTutup: (r: BarisRuang, alasan: string) => Promise<BPJSError | null>;
  onBukaKembali: (r: BarisRuang) => Promise<BPJSError | null>;
}) {
  const id = useId();
  const judulLaporanRef = useRef<HTMLHeadingElement>(null);
  const [dialog, setDialog] = useState({ buka: false, n: 0 });

  const r = ruang;
  const g = r ? GOLONGAN_KELAS[golonganKelas(r.kdKelas)] : null;
  const st = r ? statusRuang(r) : "buka";
  const segar = r ? kesegaran(r.lastSyncISO, sekarang) : null;
  const pct = r && r.kapasitas > 0 ? Math.round((r.terisi / r.kapasitas) * 100) : 0;

  return (
    <Sheet open={open && r !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent data-accent="emerald" className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md">
        <SheetHeader className="gap-0.5 p-4 pr-12">
          <SheetDescription className="text-[11px]">Ruang rawat</SheetDescription>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <SheetTitle className="truncate text-sm">{r?.namaRuang}</SheetTitle>
            {st !== "buka" && (
              <BadgeNada tone={LABEL_STATUS[st].tone} titik>
                {LABEL_STATUS[st].label}
              </BadgeNada>
            )}
          </div>
          {r && g && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
              <span className="inline-flex items-center gap-1">
                Kode <span className="font-medium text-foreground">{r.kodeRuang}</span>
                <CopyButton value={r.kodeRuang} label={`kode ruang ${r.kodeRuang}`} />
              </span>
              <BadgeNada tone={g.tone}>
                {kelasBPJSLabel(r.kdKelas)} · {g.label}
              </BadgeNada>
            </p>
          )}
        </SheetHeader>

        {r && segar && (
          <div className="flex flex-col gap-5 px-4 pb-4">
            <section aria-label="Tempat tidur" className="flex flex-col gap-2">
              <dl className="grid grid-cols-3 gap-2">
                <UbinAngka label="Terisi" nilai={r.terisi} ket={`${pct}% kapasitas`} />
                <UbinAngka label="Tersedia" nilai={r.tersedia} nada="emerald" ket="dilaporkan" />
                <UbinAngka label="Tidak siap" nilai={tidakSiap(r)} ket="nonaktif/perawatan" />
              </dl>
              <Meter
                value={Math.min(r.terisi, r.kapasitas)}
                max={Math.max(r.kapasitas, 1)}
                tone={nadaKeterisian(r.terisi, r.kapasitas)}
                label={`Keterisian ${r.namaRuang} ${pct} persen`}
              />
              <p className="text-[11px] text-muted-foreground tabular-nums">Kapasitas {r.kapasitas} tempat tidur</p>
            </section>

            <section aria-labelledby={`${id}-laporan`} className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 id={`${id}-laporan`} ref={judulLaporanRef} tabIndex={-1} className="text-xs font-semibold outline-none">
                  Laporan ke Aplicares
                </h3>
                <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[segar.tone])} />
                  <span>
                    {segar.label} · dikirim{" "}
                    <time dateTime={r.lastSyncISO} title={fmtWaktu(r.lastSyncISO)}>
                      {waktuRelatif(r.lastSyncISO, sekarang)}
                    </time>
                  </span>
                </p>
              </div>
              {st === "tutup" ? (
                <BlokTutup
                  key={`tutup-${r.kodeRuang}`}
                  r={r}
                  onBukaKembali={async () => {
                    const err = await onBukaKembali(r);
                    // Tombol "Buka kembali" hilang (diganti form) → fokus ke judul bagian.
                    if (!err) requestAnimationFrame(() => judulLaporanRef.current?.focus());
                    return err;
                  }}
                />
              ) : (
                <FormLaporan key={`form-${r.kodeRuang}`} r={r} onKirim={(nilai) => onKirim(r, nilai)} />
              )}
            </section>
          </div>
        )}

        {r && (
          <SheetFooter className="mt-auto flex-row justify-end gap-2 p-4 pt-0">
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/ehis-master/ruangan">
                <Building2 aria-hidden="true" />
                Master ruangan
              </Link>
            </Button>
            {st !== "tutup" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDialog((d) => ({ buka: true, n: d.n + 1 }))}
                className="text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <DoorClosed aria-hidden="true" />
                Tutup sementara
              </Button>
            )}
          </SheetFooter>
        )}

        {r && (
          <TutupRuangDialog
            key={dialog.n}
            ruang={r}
            open={dialog.buka}
            onOpenChange={(o) => setDialog((d) => ({ ...d, buka: o }))}
            onTutup={(alasan) => onTutup(r, alasan)}
            fokusSesudah={() => judulLaporanRef.current?.focus()}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
