"use client";

// ANT2 — Sheet detail satu antrean (dibuka dari nama pasien / menu ⋯). Isi yang tidak muat di tabel:
// ringkasan waktu (tunggu · estimasi poli · panggilan), data pasien (NIK disamarkan, bisa
// ditampilkan), data kunjungan, dan riwayat TaskID Antrol (waktu + status kirim ke BPJS).
// Aksi di kaki mengikuti status; loket tertutup → satu tombol "Buka loket" yang mengarahkan ke form.
// Record dibaca ulang dari store oleh induk → status di Sheet ikut berubah sesudah Panggil.
// Komponen shadcn: Sheet · Button · Badge.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Activity, BellRing, DoorOpen, Eye, EyeOff, PhoneCall, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { UbinAngka } from "@/components/bpjs/shared/daftarUi";
import { BadgeNada } from "@/components/bpjs/shared/vclaimUi";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { cn } from "@/lib/ui/utils";
import { getPoli } from "@/lib/antrean/onsiteMock";
import { loketLabel } from "@/lib/antrean/posStore";
import type { LoketSession, PanggilanRef } from "@/lib/antrean/loketStore";
import { TASK_LABEL, TASK_SEQUENCE, type AntreanRecord, type KirimStatus, type TaskId } from "@/lib/antrean/types";
import type { AksiBaris } from "./AntreanTable";
import {
  BayarBadge,
  JenisBadge,
  STATUS_TUNGGU,
  SUMBER_LABEL,
  StatusBadge,
  aksiAntrean,
  fmtDurasi,
  fmtJam,
  fmtTglLahir,
  menitSejak,
  nadaTunggu,
  samarkanNik,
  usiaTahun,
} from "./boardShared";

const KIRIM: Record<KirimStatus, { label: string; tone: BadgeTone }> = {
  terkirim: { label: "Terkirim", tone: "emerald" },
  pending: { label: "Antre kirim", tone: "amber" },
  gagal: { label: "Gagal kirim", tone: "rose" },
};

const TITIK_KIRIM: Record<KirimStatus, string> = {
  terkirim: "bg-emerald-500",
  pending: "bg-amber-500",
  gagal: "bg-rose-500",
};

function fmtJamDetik(ms: number): string {
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AntreanSheet({
  rec,
  open,
  session,
  panggilanRef,
  sekarang,
  onClose,
  onCloseAutoFocus,
  aksi,
}: {
  rec: AntreanRecord | null;
  open: boolean;
  session: LoketSession | null;
  panggilanRef?: PanggilanRef;
  sekarang: number;
  onClose: () => void;
  /** Ganti tujuan fokus sesudah Sheet menutup (mis. ke form Buka loket); bawaan = pemicu. */
  onCloseAutoFocus?: (e: Event) => void;
  aksi: Omit<AksiBaris, "onDetail">;
}) {
  const a = rec ? aksiAntrean(rec) : null;
  const loketAktif = session !== null;
  const adaAksi = !!a && (a.panggil || a.ulang || a.respon || a.batal);

  return (
    <Sheet open={open && rec !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        data-accent="emerald"
        onCloseAutoFocus={onCloseAutoFocus}
        className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md"
      >
        <SheetHeader className="gap-1 p-4 pr-12">
          <SheetDescription className="text-[11px]">
            {rec ? `Antrean ${SUMBER_LABEL[rec.sumber]} · ${rec.tanggal}` : "Antrean"}
          </SheetDescription>
          <SheetTitle className="flex min-w-0 items-baseline gap-2 text-sm">
            <span className="text-base font-semibold tabular-nums">{rec?.nomorAntrean}</span>
            <span className="truncate">{rec?.pasien.nama}</span>
          </SheetTitle>
          {rec && (
            <>
              <div className="flex flex-wrap items-center gap-1">
                <StatusBadge status={rec.status} />
                <JenisBadge jenis={rec.jenisPasien} />
                <BayarBadge caraBayar={rec.caraBayar} />
              </div>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                Kode booking <span className="font-medium text-foreground">{rec.kodebooking}</span>
                <CopyButton value={rec.kodebooking} label={`kode booking ${rec.kodebooking}`} />
              </p>
            </>
          )}
        </SheetHeader>

        {rec && <IsiDetail key={rec.kodebooking} rec={rec} panggilanRef={panggilanRef} sekarang={sekarang} />}

        {rec && a && adaAksi && (
          <SheetFooter className="mt-auto flex-row flex-wrap items-center justify-end gap-2 p-4 pt-0">
            {!loketAktif ? (
              <>
                <p className="mr-auto text-[11px] text-muted-foreground">Buka loket untuk memproses antrean ini.</p>
                <Button type="button" size="sm" onClick={aksi.onPerluLoket} className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                  <DoorOpen aria-hidden="true" />
                  Buka loket
                </Button>
              </>
            ) : (
              <>
                {a.batal && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => aksi.onBatal(rec)}
                    className="mr-auto h-8 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  >
                    <XCircle aria-hidden="true" />
                    Batal / tidak hadir
                  </Button>
                )}
                {a.ulang && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => aksi.onPanggilUlang(rec)} className="h-8 text-xs">
                    <BellRing aria-hidden="true" />
                    Panggil ulang
                  </Button>
                )}
                {a.panggil && (
                  <Button type="button" size="sm" onClick={() => aksi.onPanggil(rec)} className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                    <PhoneCall aria-hidden="true" />
                    Panggil ke loket
                  </Button>
                )}
                {a.respon && (
                  <Button type="button" size="sm" onClick={() => aksi.onRespon(rec)} className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                    <UserCheck aria-hidden="true" />
                    Respon kedatangan
                  </Button>
                )}
              </>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function IsiDetail({ rec, panggilanRef, sekarang }: { rec: AntreanRecord; panggilanRef?: PanggilanRef; sekarang: number }) {
  const poliNama = rec.kodepoli ? (getPoli(rec.kodepoli)?.nama ?? rec.poli) : rec.poli;
  const tunggu = STATUS_TUNGGU.includes(rec.status) ? menitSejak(rec.createdAt, sekarang) : null;
  const usia = usiaTahun(rec.pasien.tglLahir, sekarang);
  const recalls = panggilanRef?.recalls ?? 0;
  const nadaTung = tunggu !== null ? nadaTunggu(tunggu) : null;

  const urutan: TaskId[] = [...TASK_SEQUENCE[rec.jenisPasien]];
  if (rec.tasks.some((t) => t.taskid === 99)) urutan.push(99);

  return (
    <div className="flex flex-col gap-5 px-4 pb-4">
      <dl className="grid grid-cols-3 gap-2">
        <UbinAngka
          label={tunggu !== null ? "Lama tunggu" : "Ambil antrean"}
          nilai={tunggu !== null ? fmtDurasi(tunggu) : fmtJam(rec.createdAt)}
          nada={nadaTung === "rose" ? "rose" : nadaTung === "amber" ? "amber" : undefined}
          ket={tunggu !== null ? `sejak ${fmtJam(rec.createdAt)}` : "jam ambil"}
        />
        <UbinAngka label="Estimasi poli" nilai={fmtJam(rec.estimasiDilayani)} ket="perkiraan dilayani" />
        <UbinAngka
          label="Panggilan"
          nilai={panggilanRef ? `${recalls + 1}×` : "—"}
          ket={panggilanRef ? `terakhir ${fmtJam(panggilanRef.calledAt)}` : "belum dipanggil"}
        />
      </dl>

      <Bagian judul="Pasien">
        <Baris label="No. RM">
          {rec.pasien.noRM ?? <span className="text-amber-800">Belum punya — didaftarkan sebagai pasien baru saat respon</span>}
        </Baris>
        <Baris label="NIK">{rec.pasien.nik ? <NikTersamar nik={rec.pasien.nik} /> : "—"}</Baris>
        <Baris label="Tanggal lahir">
          {fmtTglLahir(rec.pasien.tglLahir)}
          {usia !== null && <span className="text-muted-foreground"> · {usia} tahun</span>}
        </Baris>
        <Baris label="Kontak">
          {rec.pasien.kontak ? (
            <a href={`tel:${rec.pasien.kontak.replace(/[^\d+]/g, "")}`} className="underline-offset-2 hover:text-emerald-800 hover:underline">
              {rec.pasien.kontak}
            </a>
          ) : (
            "—"
          )}
        </Baris>
      </Bagian>

      <Bagian judul="Kunjungan">
        <Baris label="Poli">{poliNama}</Baris>
        <Baris label="Dokter">{rec.dokter}</Baris>
        <Baris label="Cara bayar">{rec.caraBayar === "BPJS" ? "BPJS Kesehatan" : "Umum"}</Baris>
        {rec.caraBayar === "BPJS" && <Baris label="No. kartu">{rec.noKartu ?? "—"}</Baris>}
        {rec.noRujukan && <Baris label="No. rujukan">{rec.noRujukan}</Baris>}
        <Baris label="Loket pemanggil">{panggilanRef ? loketLabel(panggilanRef.pos, panggilanRef.loket) : "—"}</Baris>
      </Bagian>

      <section aria-labelledby={`task-${rec.kodebooking}`} className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 id={`task-${rec.kodebooking}`} className="text-xs font-semibold">
            Riwayat task Antrol
          </h3>
          <Button asChild variant="ghost" size="xs" className="text-emerald-700 hover:text-emerald-800">
            <Link href="/ehis-antrian/monitoring">
              <Activity aria-hidden="true" />
              Monitoring
            </Link>
          </Button>
        </div>
        <ol className="flex flex-col rounded-xl bg-slate-50 p-3">
          {urutan.map((taskid) => {
            const log = rec.tasks.find((t) => t.taskid === taskid);
            return (
              <li
                key={taskid}
                className="relative flex items-start gap-3 pb-3 last:pb-0 before:absolute before:top-3.5 before:bottom-0 before:left-[4.5px] before:w-px before:bg-slate-200 last:before:hidden"
              >
                <span
                  aria-hidden="true"
                  className={cn("relative mt-1 size-2.5 shrink-0 rounded-full ring-2 ring-slate-50", log ? TITIK_KIRIM[log.kirim] : "bg-slate-300")}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs", log ? "font-medium" : "text-muted-foreground")}>
                    <span className="tabular-nums">Task {taskid}</span> · {TASK_LABEL[taskid]}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {log ? fmtJamDetik(log.waktu) : "Belum terjadi"}
                    {log?.error && <span className="text-rose-800"> · {log.error}</span>}
                  </p>
                </div>
                {log && <BadgeNada tone={KIRIM[log.kirim].tone}>{KIRIM[log.kirim].label}</BadgeNada>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold">{judul}</h3>
      <dl className="flex flex-col divide-y divide-slate-100 rounded-xl bg-slate-50 px-3">{children}</dl>
    </section>
  );
}

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-xs wrap-break-word tabular-nums">{children}</dd>
    </div>
  );
}

/** NIK disamarkan secara bawaan (data pribadi); petugas bisa menampilkannya untuk verifikasi. */
function NikTersamar({ nik }: { nik: string }) {
  const [tampil, setTampil] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      <span>{tampil ? nik : samarkanNik(nik)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-pressed={tampil}
        onClick={() => setTampil((t) => !t)}
        className="text-muted-foreground hover:text-foreground"
      >
        {tampil ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        <span className="sr-only">Tampilkan NIK lengkap</span>
      </Button>
    </span>
  );
}
