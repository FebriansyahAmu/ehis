"use client";

import { IdCard, Activity, BookOpen, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, TextArea, Select, ChipToggle, ToggleSwitch, SectionGroup,
  MasterDetailPanel,
} from "@/components/master/shared";
import type {
  AsesmenItem, AsesmenKategori, AsesmenSeverity, AsesmenStatus,
} from "@/lib/master/asesmenKatalogMock";
import { isAsesmenValid, asesmenInitials, getAsesmenStatusCfg } from "@/lib/master/asesmenKatalogMock";
import {
  KATEGORI_CFG, KATEGORI_ORDER, KATEGORI_GROUPS,
  SEVERITY_CFG, SEVERITY_OPTS,
} from "./asesmenKatalogShared";

interface Props {
  draft: AsesmenItem;
  isNew: boolean;
  isDirty: boolean;
  onPatch: (p: Partial<AsesmenItem>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const HEAD_VIOLET  = { bg: "bg-violet-50",  text: "text-violet-700"  };
const HEAD_SKY     = { bg: "bg-sky-50",     text: "text-sky-700"     };
const HEAD_SLATE   = { bg: "bg-slate-50",   text: "text-slate-700"   };

const STATUS_OPTS: { value: AsesmenStatus; label: string }[] = [
  { value: "Aktif",     label: "Aktif" },
  { value: "Non_Aktif", label: "Non-Aktif" },
];

export default function AsesmenDetail({
  draft, isNew, isDirty, onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isAsesmenValid(draft, isNew);
  const showSnomed = draft.kategori.startsWith("Allergen");
  const showSeverity = draft.kategori === "ReaksiAlergi";

  return (
    <MasterDetailPanel
      accent="violet"
      headerContent={<HeaderContent draft={draft} isNew={isNew} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabsAriaLabel="Detail item asesmen"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Identitas */}
        <SectionGroup title="Identitas Item" icon={<IdCard size={11} />} accent={HEAD_VIOLET}>
          <div className="flex flex-col gap-3">
            <Field label="Nama Item" required>
              <TextInput
                value={draft.nama}
                onChange={(v) => onPatch({ nama: v })}
                placeholder="Mis. Penisilin, Anafilaksis, Hipertensi"
                accent="violet"
              />
            </Field>
            <Field label="Kode Internal" required hint="Format bebas (mis. ALG-OB-001 atau internal lain)">
              <TextInput
                value={draft.kode}
                onChange={(v) => onPatch({ kode: v.toUpperCase() })}
                placeholder="ALG-OB-001"
                className="font-mono"
                maxW="max-w-[220px]"
                accent="violet"
              />
            </Field>
            <Field label="Deskripsi Singkat" hint="Tampil di detail; max 200 karakter">
              <TextArea
                value={draft.deskripsi ?? ""}
                onChange={(v) => onPatch({ deskripsi: v.slice(0, 200) })}
                placeholder="Penjelasan klinis singkat — reaksi silang, kontraindikasi, dll."
                rows={3}
                accent="violet"
              />
            </Field>
          </div>
        </SectionGroup>

        {/* Kategori */}
        <SectionGroup title="Klasifikasi" icon={<Tag size={11} />} accent={HEAD_SKY}>
          <div className="flex flex-col gap-3">
            <Field label="Kategori" required>
              <Select<AsesmenKategori>
                value={draft.kategori}
                onChange={(v) => v && onPatch({ kategori: v })}
                options={KATEGORI_ORDER.map((k) => ({ value: k, label: KATEGORI_CFG[k].label }))}
                maxW="max-w-none"
                accent="sky"
              />
            </Field>

            {/* Preview kategori chip */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Preview Badge
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <KategoriPreview kategori={draft.kategori} />
                <span className="text-[10px] text-slate-400">
                  Grup: {KATEGORI_GROUPS.find((g) => g.items.includes(draft.kategori))?.label ?? "—"}
                </span>
              </div>
            </div>

            {/* SNOMED (kondisional untuk allergen) */}
            {showSnomed && (
              <Field label="SNOMED CT Code" hint="Opsional — interoperabilitas FHIR AllergyIntolerance.code">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={12} className="text-slate-400" />
                  <TextInput
                    value={draft.snomedCode ?? ""}
                    onChange={(v) => onPatch({ snomedCode: v || undefined })}
                    placeholder="764146007"
                    className="font-mono"
                    maxW="max-w-[200px]"
                    accent="teal"
                  />
                </div>
              </Field>
            )}

            {/* Severity default (kondisional untuk reaksi) */}
            {showSeverity && (
              <Field label="Severity Default" hint="Severity awal saat dipilih sebagai reaksi (boleh di-override)">
                <ChipToggle<AsesmenSeverity>
                  value={draft.severityDefault ?? "Ringan"}
                  onChange={(v) => onPatch({ severityDefault: v })}
                  options={SEVERITY_OPTS.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                  accent="rose"
                />
                {draft.severityDefault && (
                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 font-semibold",
                      SEVERITY_CFG[draft.severityDefault].bg,
                      SEVERITY_CFG[draft.severityDefault].text,
                    )}>
                      {draft.severityDefault}
                    </span>
                    <span className="text-slate-400">
                      Tampil sebagai severity awal di AllergyPane saat reaksi ini dipilih
                    </span>
                  </div>
                )}
              </Field>
            )}
          </div>
        </SectionGroup>

        {/* Status — full width */}
        <div className="lg:col-span-2">
          <SectionGroup title="Status" icon={<Activity size={11} />} accent={HEAD_SLATE}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Status">
                <ChipToggle<AsesmenStatus>
                  value={draft.status}
                  onChange={(v) => onPatch({ status: v })}
                  options={STATUS_OPTS}
                  accent="violet"
                />
              </Field>
              <ToggleSwitch
                value={draft.status === "Aktif"}
                onChange={(v) => onPatch({ status: v ? "Aktif" : "Non_Aktif" })}
                accent="emerald"
                label="Item Aktif untuk Workflow"
                desc="Hanya item aktif yang muncul di dropdown asesmen. Non-aktif tetap terlihat di histori."
              />
            </div>
          </SectionGroup>
        </div>
      </div>
    </MasterDetailPanel>
  );
}

// ── Header ───────────────────────────────────────────────

function HeaderContent({ draft, isNew }: { draft: AsesmenItem; isNew: boolean }) {
  const katCfg = KATEGORI_CFG[draft.kategori];
  const stsCfg = getAsesmenStatusCfg(draft.status);
  const initials = asesmenInitials(draft);
  const KatIcon = katCfg.icon;

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        isNew ? "bg-emerald-100 text-emerald-700" : cn(katCfg.bg, katCfg.text),
      )}>
        {isNew ? <span className="text-sm font-black">{initials}</span> : <KatIcon size={18} />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">
            {draft.nama || <span className="italic text-slate-400">Item baru…</span>}
          </p>
          {isNew && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              + Entri Baru
            </span>
          )}
        </div>
        {!isNew && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {draft.kode && (
              <span className="font-mono text-[10px] text-slate-400">{draft.kode}</span>
            )}
            <KategoriPreview kategori={draft.kategori} />
            {draft.snomedCode && (
              <span className="rounded bg-teal-50 px-1.5 py-0 font-mono text-[10px] text-teal-700">
                SCT {draft.snomedCode}
              </span>
            )}
            <span className={cn(
              "flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium",
              stsCfg.bg, stsCfg.text,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", stsCfg.dot)} />
              {stsCfg.label}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ── Kategori preview chip ────────────────────────────────

function KategoriPreview({ kategori }: { kategori: AsesmenKategori }) {
  const cfg = KATEGORI_CFG[kategori];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
      cfg.bg, cfg.text,
    )}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}
