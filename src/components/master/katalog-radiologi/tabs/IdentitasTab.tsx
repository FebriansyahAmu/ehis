"use client";

import { IdCard, Scan, Timer, Clock4 } from "lucide-react";
import type {
  RadCatalogRecord, RadRegion, RadKategori, RadStatus,
} from "@/lib/master/radCatalogMock";
import {
  MODALITAS_CFG, MODALITAS_ORDER, REGION_LABEL, REGION_ORDER,
} from "../katalogRadiologiShared";
import {
  Field, TextInput, NumberInput, TextArea, Select, SectionGroup, ChipToggle,
} from "@/components/master/shared";

interface Props {
  draft: RadCatalogRecord;
  onPatch: (p: Partial<RadCatalogRecord>) => void;
}

const KATEGORI_OPTIONS: { value: RadKategori; label: string }[] = [
  { value: "Diagnostik", label: "Diagnostik" },
  { value: "Intervensi", label: "Intervensi" },
  { value: "Skrining",   label: "Skrining" },
];

const STATUS_OPTIONS: { value: RadStatus; label: string }[] = [
  { value: "Aktif",     label: "Aktif" },
  { value: "Non_Aktif", label: "Non-Aktif" },
];

export default function IdentitasTab({ draft, onPatch }: Props) {
  const updateTat = <K extends keyof RadCatalogRecord["tatTargetMenit"]>(
    key: K, value: number,
  ) => {
    onPatch({ tatTargetMenit: { ...draft.tatTargetMenit, [key]: value } });
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* Identitas Dasar */}
      <SectionGroup title="Identitas Dasar" icon={<IdCard size={11} />}>
        <div className="flex flex-col gap-3">
          <Field label="Nama Pemeriksaan" required>
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="Mis. CT Thorax dengan Kontras"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kode" required hint="ICD-9-CM atau internal">
              <TextInput
                value={draft.kode}
                onChange={(v) => onPatch({ kode: v })}
                placeholder="ICD-87.41"
                className="font-mono"
                maxW="max-w-[180px]"
              />
            </Field>
            <Field label="Kategori">
              <Select<RadKategori>
                value={draft.kategori}
                onChange={(v) => v && onPatch({ kategori: v })}
                options={KATEGORI_OPTIONS}
                maxW="max-w-[200px]"
              />
            </Field>
          </div>
          <Field label="Deskripsi Singkat" hint="Tampil di card hover, max 200 karakter">
            <TextArea
              value={draft.deskripsi ?? ""}
              onChange={(v) => onPatch({ deskripsi: v.slice(0, 200) })}
              rows={3}
              placeholder="Indikasi utama, lini pertama untuk apa, peringatan klinis singkat..."
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Modalitas & Region */}
      <SectionGroup title="Modalitas & Region" icon={<Scan size={11} />}>
        <div className="flex flex-col gap-3">
          <Field label="Modalitas" required>
            <div className="flex flex-wrap gap-1.5">
              {MODALITAS_ORDER.map((m) => {
                const cfg = MODALITAS_CFG[m];
                const active = draft.modalitas === m;
                const Icon = cfg.icon;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onPatch({ modalitas: m })}
                    className={cnBtn(active, cfg.bg, cfg.text)}
                  >
                    <Icon size={11} />
                    {cfg.short}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Region Tubuh">
            <Select<RadRegion>
              value={draft.region}
              onChange={(v) => v && onPatch({ region: v })}
              options={REGION_ORDER.map((r) => ({ value: r, label: REGION_LABEL[r] }))}
              maxW="max-w-[260px]"
            />
          </Field>
          <Field label="Status">
            <ChipToggle<RadStatus>
              value={draft.status}
              onChange={(v) => onPatch({ status: v })}
              options={STATUS_OPTIONS}
              accent="rose"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Timing — full width */}
      <div className="lg:col-span-2">
        <SectionGroup
          title="Estimasi & TAT Target"
          icon={<Timer size={11} />}
          desc="Estimasi durasi prosedur dan target Turn-Around Time per urgensi (menit, dari akuisisi sampai laporan rilis)"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Estimasi Prosedur" required hint="menit (akuisisi)">
              <NumberInput
                value={draft.estimasiWaktuMenit}
                onChange={(v) => onPatch({ estimasiWaktuMenit: v ?? 0 })}
                min={1}
                max={180}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
            <Field label="TAT CITO" hint="≤ menit">
              <NumberInput
                value={draft.tatTargetMenit.cito}
                onChange={(v) => updateTat("cito", v ?? 0)}
                min={1}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
            <Field label="TAT Semi-Cito" hint="≤ menit">
              <NumberInput
                value={draft.tatTargetMenit.semiCito}
                onChange={(v) => updateTat("semiCito", v ?? 0)}
                min={1}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
            <Field label="TAT Rutin" hint="≤ menit">
              <NumberInput
                value={draft.tatTargetMenit.rutin}
                onChange={(v) => updateTat("rutin", v ?? 0)}
                min={1}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
          </div>

          {/* Preview info */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
            <Clock4 size={12} className="text-slate-400" />
            <p className="text-[10.5px] text-slate-600">
              <strong className="text-slate-800">{draft.estimasiWaktuMenit || 0} mnt</strong> prosedur ·
              CITO <strong className="text-rose-700">{draft.tatTargetMenit.cito}</strong> /
              Semi-Cito <strong className="text-amber-700">{draft.tatTargetMenit.semiCito}</strong> /
              Rutin <strong className="text-slate-700">{draft.tatTargetMenit.rutin}</strong> mnt
            </p>
          </div>
        </SectionGroup>
      </div>
    </div>
  );
}

// ── Helper ──
function cnBtn(active: boolean, bgActive: string, textActive: string) {
  return [
    "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-rose-200",
    active
      ? `${bgActive} ${textActive} border-transparent ring-1 ring-current`
      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
  ].join(" ");
}

