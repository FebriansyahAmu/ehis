"use client";

// Detail satu panggilan web service BPJS (data sudah ada di log, tanpa panggilan baru) di Sheet
// shadcn dari kanan: hasil + arti kode, waktu, durasi, aktor, cons-id, ID entri & idempotency key
// (bisa disalin), RANTAI PERCOBAAN dengan idempotency key yang sama (mis. gagal timeout → percobaan
// ke-1 berhasil), dan sidik hash permintaan/respons. Aksi: saring log ke endpoint ini.
// Dulu modal buatan sendiri dengan tombol "Retry Request" yang hanya memunculkan toast dan "stack
// trace" karangan — keduanya dihapus: log audit hanya mencatat, aksi ulang dilakukan dari fitur asalnya.
// Komponen shadcn: Sheet · Badge · Button.

import { useState, type ReactNode } from "react";
import { CheckCircle2, ListFilter, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { fmtWaktu } from "@/components/bpjs/shared/tanggal";
import { BadgeNada } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";
import { BATAS_LAMBAT_MS, NADA_METODE, artiKode, fmtDurasi, jamLokal, layananDari, nadaDurasi } from "./auditShared";

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

function Isi({ e, semua }: { e: BPJSAuditEntry; semua: readonly BPJSAuditEntry[] }) {
  const lambat = e.durationMs >= BATAS_LAMBAT_MS;
  const nadaDur = nadaDurasi(e.durationMs);
  const rantai = e.idempotencyKey
    ? semua.filter((x) => x.idempotencyKey === e.idempotencyKey).toSorted((a, b) => a.timestamp.localeCompare(b.timestamp))
    : [];

  return (
    <div className="flex flex-col gap-5 px-4 pb-4">
      <div className={cn("flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs/relaxed", e.success ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950")}>
        {e.success ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-700" aria-hidden="true" />}
        <p>
          <span className="font-semibold">{e.success ? "Berhasil" : "Gagal"}</span> · kode <span className="font-semibold tabular-nums">{e.responseCode}</span> {artiKode(e.responseCode)}
          {e.errorType && (
            <span className="block text-[11px] opacity-80">
              Jenis galat: <span className="font-medium">{e.errorType}</span>
            </span>
          )}
        </p>
      </div>

      <dl className="flex flex-col gap-3">
        <Baris label="Waktu">
          <time dateTime={e.timestamp} className="tabular-nums">
            {fmtWaktu(e.timestamp)}
            <span className="font-normal text-muted-foreground"> · {jamLokal(e.timestamp)}</span>
          </time>
        </Baris>
        <Baris label="Durasi">
          <span className={cn("tabular-nums", nadaDur === "rose" ? "text-rose-700" : nadaDur === "amber" ? "text-amber-800" : "")}>
            {fmtDurasi(e.durationMs)}
          </span>
          {lambat && <span className="font-normal text-muted-foreground"> · melewati {BATAS_LAMBAT_MS / 1000} detik</span>}
        </Baris>
        <Baris label="Layanan">{layananDari(e.endpoint)}</Baris>
        <Baris label="Aktor">
          {e.actor}
          <span className="font-normal text-muted-foreground"> · {e.actorRole}</span>
        </Baris>
        <Baris label="Cons ID">
          <span className="tabular-nums">{e.consId}</span>
        </Baris>
        <Baris label="ID entri">
          <span className="inline-flex max-w-full items-center gap-1">
            <span className="truncate tabular-nums">{e.id}</span>
            <CopyButton value={e.id} label={`ID entri ${e.id}`} />
          </span>
        </Baris>
        {e.idempotencyKey && (
          <Baris label="Idempotency key">
            <span className="inline-flex max-w-full items-center gap-1">
              <span className="truncate tabular-nums" title={e.idempotencyKey}>
                {e.idempotencyKey}
              </span>
              <CopyButton value={e.idempotencyKey} label="idempotency key" />
            </span>
            {(e.retryCount ?? 0) > 0 && <span className="block font-normal text-muted-foreground">Percobaan ulang ke-{e.retryCount}</span>}
          </Baris>
        )}
      </dl>

      {rantai.length > 1 && (
        <section aria-label="Percobaan dengan idempotency key yang sama" className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Percobaan dengan kunci yang sama</h3>
          <p className="text-[11px] text-muted-foreground">Kunci yang sama mencegah data terkirim dua kali saat permintaan diulang.</p>
          <ol className="flex flex-col gap-1">
            {rantai.map((x, i) => (
              <li
                key={x.id}
                aria-current={x.id === e.id ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs tabular-nums",
                  x.id === e.id ? "bg-white ring-1 ring-emerald-600 ring-inset" : "bg-slate-50",
                )}
              >
                {x.success ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-700" aria-hidden="true" /> : <XCircle className="size-3.5 shrink-0 text-rose-700" aria-hidden="true" />}
                <span className="font-medium">Percobaan {i + 1}</span>
                <span className="text-muted-foreground">
                  {jamLokal(x.timestamp)} · kode {x.responseCode} {x.success ? "berhasil" : `gagal (${artiKode(x.responseCode).toLowerCase()})`}
                </span>
                {/* Status sudah diumumkan lewat aria-current → teks ini hanya untuk mata. */}
                {x.id === e.id && (
                  <span aria-hidden="true" className="ml-auto text-[11px] text-emerald-800">
                    sedang dilihat
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-label="Sidik hash" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold">Sidik hash</h3>
        <dl className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
          <Baris label="Permintaan">
            <span className="break-all tabular-nums">{e.requestHash}</span>
          </Baris>
          <Baris label="Respons">
            <span className="break-all tabular-nums">{e.responseHash ?? <span className="font-normal text-muted-foreground">Tidak ada (tanpa respons berhasil)</span>}</span>
          </Baris>
        </dl>
        <p className="text-[11px] text-muted-foreground">Isi permintaan dan respons tidak disimpan, hanya sidik hash-nya (UU PDP 27/2022).</p>
      </section>
    </div>
  );
}

export default function AuditSheet({
  entri,
  semua,
  onClose,
  onSaringEndpoint,
}: {
  entri: BPJSAuditEntry | null;
  /** Seluruh log — untuk rantai percobaan dengan idempotency key yang sama. */
  semua: readonly BPJSAuditEntry[];
  onClose: () => void;
  onSaringEndpoint: (endpoint: string) => void;
}) {
  // Entri terakhir tetap tampil selama animasi tutup (props sudah null) — pola adjust-on-render.
  const [tampil, setTampil] = useState(entri);
  if (entri !== null && entri !== tampil) setTampil(entri);

  return (
    <Sheet open={entri !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent data-accent="emerald" className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md">
        <SheetHeader className="gap-1 p-4 pr-12">
          <SheetDescription className="text-[11px]">Panggilan {tampil ? layananDari(tampil.endpoint) : "BPJS"}</SheetDescription>
          {tampil && (
            <div className="flex min-w-0 items-start gap-2">
              <BadgeNada tone={NADA_METODE[tampil.method]} className="mt-0.5 shrink-0 tabular-nums">
                {tampil.method}
              </BadgeNada>
              <SheetTitle className="min-w-0 text-sm/snug wrap-break-word">{tampil.endpoint}</SheetTitle>
            </div>
          )}
        </SheetHeader>
        {tampil && <Isi key={tampil.id} e={tampil} semua={semua} />}
        {tampil && (
          <SheetFooter className="mt-auto flex-row justify-end p-4 pt-0">
            <Button variant="secondary" size="sm" onClick={() => onSaringEndpoint(tampil.endpoint)} className="text-xs">
              <ListFilter aria-hidden="true" />
              Lihat semua panggilan ke endpoint ini
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
