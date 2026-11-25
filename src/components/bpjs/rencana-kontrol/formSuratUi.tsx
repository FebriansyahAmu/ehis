"use client";

// Potongan UI form surat rencana kontrol / SPRI: langkah bernomor (berubah jadi centang saat
// lengkap), panel ringkasan yang ikut berubah, dan daftar data uji. Juga `fokusRadio` untuk
// memindahkan fokus ke grup pilihan (RadioGroup) yang belum diisi saat simpan gagal.
// Komponen shadcn: Card · Collapsible · Button · Item.

import type { ReactNode } from "react";
import { Check, ChevronDown, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item } from "@/components/ui/item";
import { fmtTgl, hariIniISO } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, KARTU } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { jadwalSurat } from "./rencanaKontrolShared";

/** Fokus ke pilihan pertama yang bisa dipilih di RadioGroup berlabel `labelId`. */
export function fokusRadio(labelId: string): void {
  document.querySelector<HTMLElement>(`[aria-labelledby="${labelId}"] [role="radio"]:not([disabled])`)?.focus();
}

export function Langkah({ id, no, judul, ket, selesai, children }: { id: string; no: number; judul: string; ket?: string; selesai: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "mt-px flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors",
            selesai ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600",
          )}
        >
          {selesai ? <Check className="size-3.5" /> : no}
        </span>
        <div className="min-w-0">
          <h3 id={id} className="text-xs font-semibold">
            {judul}
            {selesai && <span className="sr-only"> (lengkap)</span>}
          </h3>
          {ket && <p className="text-[11px] text-muted-foreground">{ket}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:pl-8.5">{children}</div>
    </section>
  );
}

export interface BarisRingkasan {
  label: string;
  nilai: string | null;
}

export function PanelRingkasan({
  judul,
  baris,
  tgl,
  catatan,
  children,
}: {
  judul: string;
  baris: BarisRingkasan[];
  tgl: string | null;
  catatan?: string;
  children?: ReactNode;
}) {
  const jadwal = tgl ? jadwalSurat(tgl, hariIniISO()) : null;
  const lengkap = baris.filter((b) => b.nilai).length;
  return (
    <Card className={cn(KARTU, "xl:sticky xl:top-5")}>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold">{judul}</h3>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {lengkap}/{baris.length} terisi
          </span>
        </div>
        <dl className="flex flex-col gap-2.5 text-xs">
          {baris.map((b) => (
            <div key={b.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
              <dt className="text-muted-foreground">{b.label}</dt>
              <dd className={cn("min-w-0 wrap-break-word", b.nilai ? "font-medium" : "text-muted-foreground/70")}>{b.nilai ?? "Belum diisi"}</dd>
            </div>
          ))}
          {tgl && (
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
              <dt className="text-muted-foreground">Tanggal</dt>
              <dd className="flex flex-wrap items-center gap-1.5 font-medium tabular-nums">
                {fmtTgl(tgl)}
                {jadwal && (
                  <BadgeNada tone={jadwal.tone} titik>
                    {jadwal.label}
                  </BadgeNada>
                )}
              </dd>
            </div>
          )}
        </dl>
        {catatan && <p className="rounded-xl bg-slate-50 p-2.5 text-[11px]/relaxed text-muted-foreground">{catatan}</p>}
        {children}
      </div>
    </Card>
  );
}

export function DataUji({ judul, pilihan, onPilih }: { judul: string; pilihan: readonly { nilai: string; label: string; ket: string }[]; onPilih: (nilai: string) => void }) {
  return (
    <Collapsible className="rounded-xl bg-slate-100/70">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="group h-auto w-full justify-start gap-1.5 rounded-xl px-3 py-2 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <FlaskConical className="size-3.5" aria-hidden="true" />
          <span className="flex-1 text-left">{judul}</span>
          <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col gap-1 px-2 pb-2">
          {pilihan.map((p) => (
            <li key={p.nilai}>
              <Item asChild size="sm" className="w-full flex-col flex-nowrap items-start gap-0 rounded-lg bg-white px-2.5 py-1.5 text-left shadow-xs hover:bg-emerald-50">
                <button type="button" onClick={() => onPilih(p.nilai)}>
                  <span className="flex w-full items-baseline justify-between gap-2">
                    <span className="text-xs text-foreground">{p.label}</span>
                    <span className="text-[11px] text-muted-foreground">{p.ket}</span>
                  </span>
                  <span className="w-full truncate text-[11px] text-muted-foreground tabular-nums">{p.nilai}</span>
                </button>
              </Item>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
