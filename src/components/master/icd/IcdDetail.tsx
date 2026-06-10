"use client";

import { IdCard, Tag, Library, Activity, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, ChipToggle, ToggleSwitch, SectionGroup,
  MasterDetailPanel,
} from "@/components/master/shared";
import {
  type IcdItem, type IcdJenis, type IcdStatus,
  isIcdValid, icdInitials, getIcdStatusCfg,
} from "@/lib/master/icdMock";
import { JENIS_CFG, JENIS_LIST } from "./icdShared";

interface Props {
  draft: IcdItem;
  isNew: boolean;
  isDirty: boolean;
  onPatch: (p: Partial<IcdItem>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const HEAD_SKY    = { bg: "bg-sky-50",    text: "text-sky-700"    };
const HEAD_VIOLET = { bg: "bg-violet-50", text: "text-violet-700" };
const HEAD_SLATE  = { bg: "bg-slate-50",  text: "text-slate-700"  };

const STATUS_OPTS: { value: IcdStatus; label: string }[] = [
  { value: "Aktif",     label: "Aktif" },
  { value: "Non_Aktif", label: "Non-Aktif" },
];

export default function IcdDetail({
  draft, isNew, isDirty, onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isIcdValid(draft, isNew);
  const isIcd10 = draft.jenis === "ICD-10";

  return (
    <MasterDetailPanel
      accent="sky"
      headerContent={<HeaderContent draft={draft} isNew={isNew} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabsAriaLabel="Detail kode ICD"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Identitas Dasar */}
        <SectionGroup title="Identitas Kode" icon={<IdCard size={11} />} accent={HEAD_SKY}>
          <div className="flex flex-col gap-3">
            <Field label="Jenis" required>
              <div className="grid grid-cols-2 gap-1.5">
                {JENIS_LIST.map((j) => {
                  const cfg = JENIS_CFG[j];
                  const active = draft.jenis === j;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => onPatch({ jenis: j })}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-left transition",
                        active
                          ? cn(cfg.bg, "border-current ring-1 ring-current")
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <Icon size={14} className={active ? cfg.text : "text-slate-400"} />
                      <div className="min-w-0">
                        <p className={cn("text-[11px] font-bold", active ? cfg.text : "text-slate-700")}>
                          {cfg.short}
                        </p>
                        <p className="text-[9px] leading-tight text-slate-500">{cfg.desc.slice(0, 40)}…</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label={isIcd10 ? "Kode ICD-10 · CODE" : "Kode ICD-9-CM · CODE"} required hint={isIcd10 ? "Format: A09, I21.0, E11.65" : "Format: 89.52, 88.72"}>
              <TextInput
                value={draft.kode}
                onChange={(v) => onPatch({ kode: v })}
                placeholder={isIcd10 ? "A09" : "89.52"}
                className="font-mono uppercase"
                maxW="max-w-[180px]"
                accent="sky"
              />
            </Field>

            <Field label="Display" required hint="Teks tampilan resmi dari SatuSehat (kolom DISPLAY)">
              <TextInput
                value={draft.nama}
                onChange={(v) => onPatch({ nama: v })}
                placeholder="Mis. Diarrhoea and gastroenteritis of presumed infectious origin"
                accent="sky"
              />
            </Field>

            <Field label="Versi · VERSION" required hint="Versi CodeSystem SatuSehat (mis. 2010)">
              <div className="flex items-center gap-1.5">
                <Hash size={12} className="text-slate-400" />
                <TextInput
                  value={draft.version}
                  onChange={(v) => onPatch({ version: v })}
                  placeholder="2010"
                  className="font-mono"
                  maxW="max-w-[120px]"
                  accent="sky"
                />
              </div>
            </Field>
          </div>
        </SectionGroup>

        {/* Atribut tambahan — opsional (pengkayaan lokal di luar 3 inti SatuSehat) */}
        <SectionGroup title="Atribut Tambahan · Opsional" icon={<Library size={11} />} accent={HEAD_VIOLET}>
          <div className="flex flex-col gap-3">
            <Field label="Nama Alternatif" hint="Opsional — terjemahan / nama lokal">
              <TextInput
                value={draft.namaInggris ?? ""}
                onChange={(v) => onPatch({ namaInggris: v })}
                placeholder="Diare dan gastroenteritis dengan asal infeksi"
                accent="violet"
              />
            </Field>

            <Field label="Chapter" hint={isIcd10 ? "Opsional — mis. IX. Sirkulasi" : "Opsional — mis. Radiologi"}>
              <TextInput
                value={draft.chapter ?? ""}
                onChange={(v) => onPatch({ chapter: v })}
                placeholder={isIcd10 ? "IX. Sirkulasi" : "Radiologi"}
                accent="violet"
              />
            </Field>

            {isIcd10 && (
              <>
                <Field label="Blok" hint="Opsional — sub-grup dalam chapter, mis. I20–I25">
                  <TextInput
                    value={draft.blok ?? ""}
                    onChange={(v) => onPatch({ blok: v })}
                    placeholder="I20–I25"
                    className="font-mono"
                    maxW="max-w-[180px]"
                    accent="violet"
                  />
                </Field>

                <Field label="INA-CBG Code" hint="Opsional — pemetaan klaim BPJS">
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-slate-400" />
                    <TextInput
                      value={draft.inaCbg ?? ""}
                      onChange={(v) => onPatch({ inaCbg: v.toUpperCase() })}
                      placeholder="I-4-12"
                      className="font-mono"
                      maxW="max-w-[180px]"
                      accent="emerald"
                    />
                  </div>
                </Field>
              </>
            )}

            {/* Preview chip */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Preview</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <JenisChip jenis={draft.jenis} />
                <span className="font-mono text-[11px] font-bold text-slate-800">{draft.kode || "—"}</span>
                {draft.version && (
                  <span className="rounded bg-sky-50 px-1.5 py-0 font-mono text-[10px] text-sky-700">v{draft.version}</span>
                )}
                <span className="truncate text-[11px] text-slate-700">{draft.nama || "Display kode…"}</span>
                {draft.inaCbg && (
                  <span className="rounded bg-emerald-50 px-1.5 py-0 font-mono text-[10px] text-emerald-700">
                    CBG {draft.inaCbg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SectionGroup>

        {/* Status — full width */}
        <div className="lg:col-span-2">
          <SectionGroup title="Status" icon={<Activity size={11} />} accent={HEAD_SLATE}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Status">
                <ChipToggle<IcdStatus>
                  value={draft.status}
                  onChange={(v) => onPatch({ status: v })}
                  options={STATUS_OPTS}
                  accent="sky"
                />
              </Field>
              <ToggleSwitch
                value={draft.status === "Aktif"}
                onChange={(v) => onPatch({ status: v ? "Aktif" : "Non_Aktif" })}
                accent="emerald"
                label="Kode Aktif untuk Workflow"
                desc="Hanya kode aktif muncul di DiagnosaTab. Histori diagnosis sebelumnya tetap terlihat."
              />
            </div>
          </SectionGroup>
        </div>
      </div>
    </MasterDetailPanel>
  );
}

// ── Header ───────────────────────────────────────────────

function HeaderContent({ draft, isNew }: { draft: IcdItem; isNew: boolean }) {
  const cfg = JENIS_CFG[draft.jenis];
  const stsCfg = getIcdStatusCfg(draft.status);
  const initials = icdInitials(draft);
  const Icon = cfg.icon;

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        isNew ? "bg-emerald-100 text-emerald-700" : cn(cfg.bg, cfg.text),
      )}>
        {isNew ? <span className="text-sm font-black">{initials}</span> : <Icon size={18} />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">
            {draft.kode || <span className="italic text-slate-400">Kode baru…</span>}
            {draft.nama && <span className="ml-2 font-normal text-slate-600">— {draft.nama}</span>}
          </p>
          {isNew && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              + Entri Baru
            </span>
          )}
        </div>
        {!isNew && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <JenisChip jenis={draft.jenis} />
            {draft.version && (
              <span className="rounded bg-sky-50 px-1.5 py-0 font-mono text-[10px] text-sky-700">v{draft.version}</span>
            )}
            {draft.chapter && <span className="text-[10px] text-slate-400">{draft.chapter}</span>}
            {draft.inaCbg && (
              <span className="rounded bg-emerald-50 px-1.5 py-0 font-mono text-[10px] text-emerald-700">
                CBG {draft.inaCbg}
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

function JenisChip({ jenis }: { jenis: IcdJenis }) {
  const cfg = JENIS_CFG[jenis];
  return (
    <span className={cn(
      "rounded px-1.5 py-0 text-[10px] font-bold",
      cfg.bg, cfg.text,
    )}>
      {cfg.short}
    </span>
  );
}
