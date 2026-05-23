"use client";

import { ClipboardList, Tags, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, Select, SectionGroup,
} from "@/components/master/shared";
import {
  type TemplateAnamnesisItem, type ChiefComplaintCategory, type ModulContext,
  KATEGORI_CFG, KATEGORI_LIST, CONTEXT_CFG, CONTEXT_LIST,
} from "@/lib/master/templateAnamnesisMock";

interface Props {
  draft: TemplateAnamnesisItem;
  onPatch: <K extends keyof TemplateAnamnesisItem>(k: K, v: TemplateAnamnesisItem[K]) => void;
}

export default function IdentitasTab({ draft, onPatch }: Props) {
  const toggleContext = (c: ModulContext) => {
    const has = draft.contextTags.includes(c);
    onPatch(
      "contextTags",
      has ? draft.contextTags.filter((x) => x !== c) : [...draft.contextTags, c],
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Identitas */}
      <SectionGroup
        title="Identitas Template"
        icon={<ClipboardList size={11} />}
        accent={{ bg: "bg-teal-50", text: "text-teal-700" }}
      >
        <Field label="Label Template" required hint="Nama tampil di picker template">
          <TextInput
            value={draft.label}
            onChange={(v) => onPatch("label", v)}
            placeholder="mis. Nyeri Dada / Angina (IGD)"
            accent="teal"
            maxW="max-w-md"
          />
        </Field>

        <Field label="Status" hint="Non-aktif menyembunyikan dari picker template">
          <Select
            value={draft.status}
            onChange={(v) => onPatch("status", v as "Aktif" | "NonAktif")}
            options={[
              { value: "Aktif", label: "Aktif" },
              { value: "NonAktif", label: "Non-Aktif" },
            ]}
            accent="teal"
            maxW="max-w-[180px]"
          />
        </Field>
      </SectionGroup>

      {/* Klasifikasi */}
      <SectionGroup
        title="Klasifikasi"
        icon={<Tags size={11} />}
        accent={{ bg: "bg-violet-50", text: "text-violet-700" }}
      >
        <Field label="Kategori Keluhan" required hint="Kelompok keluhan utama">
          <Select
            value={draft.kategori}
            onChange={(v) => onPatch("kategori", v as ChiefComplaintCategory)}
            options={KATEGORI_LIST.map((k) => ({ value: k, label: KATEGORI_CFG[k].label }))}
            accent="teal"
            maxW="max-w-[260px]"
          />
        </Field>

        <Field label="Modul Context" required hint="Modul mana template ini boleh dipakai">
          <div className="flex flex-wrap gap-1.5">
            {CONTEXT_LIST.map((c) => {
              const cfg = CONTEXT_CFG[c];
              const active = draft.contextTags.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleContext(c)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition",
                    active
                      ? cn(cfg.bg, cfg.text, "border-current ring-1 ring-current")
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                  <span>{cfg.label}</span>
                  <span className="text-[9px] font-normal opacity-70">— {cfg.long}</span>
                </button>
              );
            })}
          </div>
        </Field>
      </SectionGroup>

      {/* Preview chip — full width */}
      <div className="lg:col-span-2">
        <SectionGroup
          title="Preview Chip"
          icon={<Layers size={11} />}
          accent={{ bg: "bg-slate-50", text: "text-slate-700" }}
        >
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Tampilan di picker template
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {draft.label || "(label kosong)"}
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  KATEGORI_CFG[draft.kategori].bg,
                  KATEGORI_CFG[draft.kategori].text,
                )}
              >
                {KATEGORI_CFG[draft.kategori].label}
              </span>
              {draft.contextTags.map((c) => {
                const cfg = CONTEXT_CFG[c];
                return (
                  <span
                    key={c}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      cfg.bg,
                      cfg.text,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </span>
                );
              })}
              {draft.contextTags.length === 0 && (
                <span className="text-[10px] italic text-rose-500">⚠ Pilih min. 1 modul context</span>
              )}
            </div>
          </div>
        </SectionGroup>
      </div>
    </div>
  );
}
