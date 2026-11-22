"use client";

// Isian penjamin non-BPJS. Hanya field yang benar-benar disimpan server (ChangePenjaminInput:
// penjaminNama + noPolis) yang ditampilkan — metode bayar dipilih di Kasir saat pembayaran.

import { useId, type RefObject } from "react";
import { ArrowRight, Banknote, Car, FileSignature, HardHat, Receipt, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout, FieldLabel, INPUT } from "./penjaminUi";

function Fact({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="m-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 m-xs leading-relaxed text-slate-600">{children}</p>
      </div>
    </li>
  );
}

export function UmumPanel() {
  return (
    <ul className="grid gap-2.5 md:grid-cols-3">
      <Fact icon={Receipt} title="Tarif umum RS">Seluruh layanan kunjungan ini ditagih dengan tarif umum.</Fact>
      <Fact icon={Banknote} title="Bayar di Kasir">Metode bayar (tunai, transfer, QRIS, kartu) dipilih saat pembayaran.</Fact>
      <Fact icon={FileSignature} title="Persetujuan biaya">Pastikan pasien/keluarga menyetujui biaya sebelum pelayanan.</Fact>
    </ul>
  );
}

export function NakerPanel({
  kpj, onKpj, onOpenKecelakaan, disabled,
}: {
  kpj: string;
  onKpj: (v: string) => void;
  onOpenKecelakaan?: () => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-xl bg-teal-50 px-3.5 py-3 text-teal-900 ring-1 ring-inset ring-teal-200">
        <HardHat className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
        <p className="m-xs leading-relaxed">
          Kecelakaan kerja / penyakit akibat kerja ditanggung <b className="font-semibold">BPJS Ketenagakerjaan (JKK)</b>,
          bukan JKN. Kunjungan dicatat sebagai penjamin Asuransi bernama BPJS Ketenagakerjaan.
        </p>
      </div>

      <div className="flex max-w-md flex-col gap-1.5">
        <FieldLabel htmlFor={`${id}-kpj`} optional>No. KPJ (kartu peserta)</FieldLabel>
        <input
          id={`${id}-kpj`}
          name="noKpj"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={40}
          value={kpj}
          disabled={disabled}
          onChange={(e) => onKpj(e.target.value)}
          aria-describedby={`${id}-kpj-hint`}
          className={`${INPUT} font-mono tracking-wider`}
        />
        <p id={`${id}-kpj-hint`} className="m-tiny text-slate-500">Disimpan sebagai nomor kepesertaan pada jaminan pasien.</p>
      </div>

      <Callout
        tone="neutral"
        icon={Car}
        title="Lengkapi laporan kecelakaan kerja"
        action={onOpenKecelakaan && (
          <Button type="button" variant="outline" size="sm" onClick={onOpenKecelakaan} className="border-slate-300 bg-white text-slate-800">
            Buka Data Kecelakaan
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      >
        NPP perusahaan, laporan Tahap I (2×24 jam), dan penetapan penjaminan e-PLKK dicatat di tab Data Kecelakaan.
      </Callout>
    </div>
  );
}

export function AsuransiPanel({
  nama, onNama, polis, onPolis, error, namaRef, disabled,
}: {
  nama: string;
  onNama: (v: string) => void;
  polis: string;
  onPolis: (v: string) => void;
  /** Pesan galat nama asuransi (muncul sesudah mencoba simpan). */
  error: string | null;
  namaRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-nama`}>
            Nama asuransi <span aria-hidden="true" className="text-rose-600">*</span>
          </FieldLabel>
          <input
            ref={namaRef}
            id={`${id}-nama`}
            name="penjaminNama"
            type="text"
            autoComplete="off"
            maxLength={120}
            required
            value={nama}
            disabled={disabled}
            onChange={(e) => onNama(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-nama-hint ${id}-nama-err` : `${id}-nama-hint`}
            className={INPUT}
          />
          <p id={`${id}-nama-hint`} className="m-tiny text-slate-500">Mis. Prudential, AXA Mandiri, Allianz.</p>
          {error && <p id={`${id}-nama-err`} className="m-xs font-medium text-rose-700">{error}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-polis`} optional>No. polis</FieldLabel>
          <input
            id={`${id}-polis`}
            name="noPolis"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={40}
            value={polis}
            disabled={disabled}
            onChange={(e) => onPolis(e.target.value)}
            className={`${INPUT} font-mono tracking-wider`}
          />
        </div>
      </div>
      <Callout tone="info">Nama dan No. polis disimpan sebagai jaminan utama pasien untuk kunjungan berikutnya.</Callout>
    </div>
  );
}
