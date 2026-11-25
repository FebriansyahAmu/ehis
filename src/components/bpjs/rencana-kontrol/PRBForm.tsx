"use client";

// Formulir Program Rujuk Balik (PRB) di rencana kontrol V2: pilih SATU penyakit kronik (RadioGroup
// berbentuk kartu), lalu hanya kolom data klinis milik penyakit itu yang tampil (dulu satu kisi
// tombol + kotak isian bergaris). Kolom angka = teks `inputMode="decimal"` (koma desimal diterima,
// tanpa roda gulir type=number) + satuan + rentang sah, galat tampil setelah ditinggal; kolom
// flag = Ya / Tidak / Belum diisi. Penghitung "n dari m terisi" membantu melihat kelengkapan.
// Komponen shadcn: RadioGroup · Label · Input.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { INPUT_ISI, PesanGalat } from "@/components/bpjs/shared/formUi";
import { cn } from "@/lib/ui/utils";
import type { PRBFormData, PRBKodeStatus } from "@/lib/bpjs/bpjsShared";
import {
  KODE_PRB,
  PRB_FIELDS_BY_KODE,
  PRB_FIELD_LABELS,
  PRB_FIELD_RANGES,
  PRB_FLAG_FIELDS,
  PRB_LABELS,
  PRB_SATUAN,
  galatNilaiPRB,
  terisiPRB,
} from "./prbShared";

const KARTU_PILIH =
  "relative flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs transition-colors hover:bg-slate-100 has-data-[state=checked]:bg-emerald-50 has-data-[state=checked]:text-emerald-900 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-emerald-600 has-data-[state=checked]:ring-inset has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-emerald-600";

const SEGMEN_FLAG =
  "relative flex-1 cursor-pointer justify-center rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground has-data-[state=checked]:bg-white has-data-[state=checked]:text-foreground has-data-[state=checked]:shadow-xs has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-emerald-600 has-data-[state=checked]:ring-inset has-focus-visible:outline-2 has-focus-visible:outline-emerald-600";

function teksAwal(data: PRBFormData): Partial<Record<keyof PRBFormData, string>> {
  const t: Partial<Record<keyof PRBFormData, string>> = {};
  for (const k of Object.keys(data) as (keyof PRBFormData)[]) {
    const v = data[k];
    if (v !== null && !PRB_FLAG_FIELDS.has(k)) t[k] = String(v).replace(".", ",");
  }
  return t;
}

function KolomAngka({
  id,
  field,
  teks,
  onTeks,
  value,
  tampilGalat,
  onTinggal,
}: {
  id: string;
  field: keyof PRBFormData;
  teks: string;
  onTeks: (t: string, v: number | null) => void;
  value: number | null;
  tampilGalat: boolean;
  onTinggal: () => void;
}) {
  const r = PRB_FIELD_RANGES[field];
  const satuan = PRB_SATUAN[field];
  const galat = tampilGalat ? galatNilaiPRB(field, value) : null;
  const inputId = `${id}-${field}`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={inputId} className="text-xs font-normal">
        {PRB_FIELD_LABELS[field]}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          value={teks}
          placeholder={r ? `${r.min.toLocaleString("id-ID")}–${r.max.toLocaleString("id-ID")}` : undefined}
          aria-invalid={Boolean(galat)}
          aria-describedby={galat ? `${inputId}-err` : undefined}
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d.,]/g, "");
            const n = Number(t.replace(",", "."));
            onTeks(t, t === "" || !Number.isFinite(n) ? null : n);
          }}
          onBlur={onTinggal}
          className={cn(INPUT_ISI, "h-9 rounded-lg text-xs tabular-nums md:text-xs", satuan && "pr-20")}
        />
        {satuan && (
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground">
            {satuan}
          </span>
        )}
      </div>
      {galat && <PesanGalat id={`${inputId}-err`}>{galat}</PesanGalat>}
    </div>
  );
}

function KolomFlag({ id, field, value, onChange }: { id: string; field: keyof PRBFormData; value: number | null; onChange: (v: number | null) => void }) {
  const groupId = `${id}-${field}`;
  const nilai = value === null ? "x" : String(value);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={`${groupId}-label`} className="text-xs">
        {PRB_FIELD_LABELS[field]}
      </span>
      <RadioGroup
        value={nilai}
        onValueChange={(v) => onChange(v === "x" ? null : Number(v))}
        aria-labelledby={`${groupId}-label`}
        className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5"
      >
        {(
          [
            ["1", "Ya"],
            ["0", "Tidak"],
            ["x", "Belum diisi"],
          ] as const
        ).map(([v, label]) => {
          // Opsi "Ya" memakai id kolom agar bisa difokuskan seperti kolom angka.
          const itemId = v === "1" ? groupId : `${groupId}-${v}`;
          return (
            <Label key={v} htmlFor={itemId} className={SEGMEN_FLAG}>
              <RadioGroupItem id={itemId} value={v} className="sr-only" />
              {label}
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

export default function PRBForm({
  id,
  kode,
  data,
  onKode,
  onField,
  galatKode,
  tampilSemuaGalat,
}: {
  /** Awalan id kolom (fokus saat simpan gagal: `${id}-kode-01`, `${id}-${kolom}`). */
  id: string;
  kode: PRBKodeStatus | null;
  data: PRBFormData;
  onKode: (k: PRBKodeStatus) => void;
  onField: (field: keyof PRBFormData, v: number | null) => void;
  galatKode: string | null;
  /** Setelah simpan dicoba, galat semua kolom ditampilkan tanpa menunggu blur. */
  tampilSemuaGalat: boolean;
}) {
  // Teks mentah per kolom angka (mis. "6," saat mengetik "6,5"); data angka dikirim ke induk.
  const [teks, setTeks] = useState(() => teksAwal(data));
  const [ditinggal, setDitinggal] = useState<ReadonlySet<keyof PRBFormData>>(() => new Set());
  const kolom = kode ? PRB_FIELDS_BY_KODE[kode] : [];
  const isi = kode ? terisiPRB(kode, data) : null;

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="sr-only">Formulir Program Rujuk Balik</legend>
      <div className="flex flex-col gap-1.5">
        <span id={`${id}-kode-label`} className="text-xs font-medium">
          Penyakit kronik peserta
          <span aria-hidden="true" className="text-rose-600">
            {" "}*
          </span>
          <span className="sr-only"> (wajib)</span>
        </span>
        <RadioGroup
          value={kode ?? ""}
          onValueChange={(v) => onKode(v as PRBKodeStatus)}
          aria-labelledby={`${id}-kode-label`}
          aria-describedby={galatKode ? `${id}-kode-err` : undefined}
          aria-invalid={Boolean(galatKode)}
          className="grid grid-cols-2 gap-1.5 sm:grid-cols-3"
        >
          {KODE_PRB.map((k) => (
            <Label key={k} htmlFor={`${id}-kode-${k}`} className={KARTU_PILIH}>
              <RadioGroupItem id={`${id}-kode-${k}`} value={k} className="sr-only" />
              <span className="min-w-0 flex-1 truncate font-medium">{PRB_LABELS[k]}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{k}</span>
            </Label>
          ))}
        </RadioGroup>
        {galatKode && <PesanGalat id={`${id}-kode-err`}>{galatKode}</PesanGalat>}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {kode && (
          <motion.div
            key={kode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3 rounded-xl bg-slate-50/80 p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-xs font-semibold">Data klinis {PRB_LABELS[kode]}</p>
              {isi && (
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {isi.terisi} dari {isi.total} terisi
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {kolom.map((f) =>
                PRB_FLAG_FIELDS.has(f) ? (
                  <KolomFlag key={f} id={id} field={f} value={data[f]} onChange={(v) => onField(f, v)} />
                ) : (
                  <KolomAngka
                    key={f}
                    id={id}
                    field={f}
                    teks={teks[f] ?? ""}
                    value={data[f]}
                    onTeks={(t, v) => {
                      setTeks((s) => ({ ...s, [f]: t }));
                      onField(f, v);
                    }}
                    tampilGalat={tampilSemuaGalat || ditinggal.has(f)}
                    onTinggal={() => setDitinggal((s) => (s.has(f) ? s : new Set(s).add(f)))}
                  />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </fieldset>
  );
}
