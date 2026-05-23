"use client";

import { FileText, MessageSquare, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextArea, SectionGroup,
} from "@/components/master/shared";
import {
  type TemplateAnamnesisItem,
  KATEGORI_CFG, CONTEXT_CFG,
} from "@/lib/master/templateAnamnesisMock";

interface Props {
  draft: TemplateAnamnesisItem;
  onPatch: <K extends keyof TemplateAnamnesisItem>(k: K, v: TemplateAnamnesisItem[K]) => void;
}

export default function PreviewTab({ draft, onPatch }: Props) {
  const katCfg = KATEGORI_CFG[draft.kategori];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Catatan perawat */}
      <SectionGroup
        title="Catatan Perawat / Pengingat Klinis"
        icon={<MessageSquare size={11} />}
        accent={{ bg: "bg-violet-50", text: "text-violet-700" }}
      >
        <Field label="Catatan / Reminder" hint="Tip operasional muncul saat template di-pakai (mis. order standar, alert klinis)">
          <TextArea
            value={draft.catatanPerawat ?? ""}
            onChange={(v) => onPatch("catatanPerawat", v)}
            placeholder="mis. Pasang akses IV + monitor EKG 12-lead segera. Order: Troponin I, EKG, CKMB."
            rows={5}
            accent="teal"
          />
        </Field>
      </SectionGroup>

      {/* Live preview */}
      <SectionGroup
        title="Preview Anamnesis Lengkap"
        icon={<Eye size={11} />}
        accent={{ bg: "bg-slate-50", text: "text-slate-700" }}
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-700">
          <div className="mb-2 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
            <FileText size={11} className="text-slate-500" />
            <span className="font-bold text-slate-800">{draft.label || "(label kosong)"}</span>
            <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase", katCfg.bg, katCfg.text)}>
              {katCfg.label}
            </span>
            {draft.contextTags.map((c) => {
              const cfg = CONTEXT_CFG[c];
              return (
                <span
                  key={c}
                  className={cn(
                    "rounded-full px-1.5 text-[9px] font-bold",
                    cfg.bg, cfg.text,
                  )}
                >
                  {cfg.label}
                </span>
              );
            })}
          </div>

          <PreviewRow label="Keluhan Utama" value={draft.keluhanUtama} />
          <PreviewRow label="RPS"            value={draft.rps} multiline />
          <PreviewRow label="Onset & Durasi" value={draft.onsetDurasi} />
          {draft.mekanismeCedera && (
            <PreviewRow label="Mekanisme Cedera" value={draft.mekanismeCedera} />
          )}
          <PreviewRow label="Faktor Pemberat" value={draft.faktorPemberat} />
          <PreviewRow label="Faktor Pereda"   value={draft.faktorPemerut} />
          <PreviewRow label="Status Generalis" value={draft.statusGeneralis} multiline />

          {draft.catatanPerawat && (
            <div className="mt-2 rounded border border-violet-200 bg-violet-50 px-2 py-1.5">
              <p className="mb-0.5 text-[9.5px] font-bold uppercase text-violet-700">
                💡 Catatan / Reminder
              </p>
              <p className="text-[10.5px] leading-snug text-violet-800">{draft.catatanPerawat}</p>
            </div>
          )}
        </div>
      </SectionGroup>
    </div>
  );
}

function PreviewRow({
  label, value, multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  if (!value.trim()) {
    return (
      <div className="mb-1.5">
        <span className="text-[9.5px] font-bold uppercase text-slate-400">{label}:</span>{" "}
        <span className="text-[10px] italic text-slate-300">(kosong)</span>
      </div>
    );
  }
  return (
    <div className="mb-1.5">
      <p className="text-[9.5px] font-bold uppercase text-slate-500">{label}</p>
      <p className={cn("text-[10.5px] leading-snug text-slate-700", multiline && "whitespace-pre-line")}>
        {value}
      </p>
    </div>
  );
}
