"use client";

import { MessageSquare, AlignLeft, Lightbulb } from "lucide-react";
import {
  Field, TextInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";
import {
  type SBARTemplate, type SBARContext,
  SBAR_CONTEXT_CFG,
} from "@/lib/master/templateFormMock";

interface Props {
  draft: SBARTemplate;
  onPatch: (patch: Partial<SBARTemplate>) => void;
}

const SBAR_FIELDS: Array<{
  key: "situation" | "background" | "assessment" | "recommendation";
  label: string;
  letter: string;
  desc: string;
  color: string;
  bg: string;
}> = [
  { key: "situation",      label: "Situation",      letter: "S", desc: "Kondisi & keluhan saat ini",          color: "text-violet-700",  bg: "bg-violet-50" },
  { key: "background",     label: "Background",     letter: "B", desc: "Riwayat singkat & terapi aktif",      color: "text-sky-700",     bg: "bg-sky-50" },
  { key: "assessment",     label: "Assessment",     letter: "A", desc: "Masalah aktif & analisis",            color: "text-amber-700",   bg: "bg-amber-50" },
  { key: "recommendation", label: "Recommendation", letter: "R", desc: "Instruksi & yang harus dipantau",     color: "text-emerald-700", bg: "bg-emerald-50" },
];

export default function SBARPane({ draft, onPatch }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SectionGroup
        title="Identitas SBAR"
        icon={<MessageSquare size={11} />}
        accent={{ bg: "bg-violet-50", text: "text-violet-700" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Label Template" required hint="Nama tampil di picker SBAR">
            <TextInput
              value={draft.label}
              onChange={(v) => onPatch({ label: v })}
              placeholder="mis. Handover Shift RI Standard"
              accent="violet"
              maxW="max-w-md"
            />
          </Field>

          <Field label="Context Pemakaian" required>
            <Select
              value={draft.context}
              onChange={(v) => onPatch({ context: v as SBARContext })}
              options={Object.entries(SBAR_CONTEXT_CFG).map(([k, c]) => ({
                value: k as SBARContext,
                label: c.label,
              }))}
              accent="violet"
              maxW="max-w-xs"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Deskripsi" hint="Penjelasan singkat kapan dipakai (opsional)">
              <TextInput
                value={draft.deskripsi ?? ""}
                onChange={(v) => onPatch({ deskripsi: v })}
                placeholder="mis. Template baku untuk timbang terima shift di Rawat Inap"
                accent="violet"
                maxW="max-w-2xl"
              />
            </Field>
          </div>

          <Field label="Status" hint="Non-aktif menyembunyikan dari picker">
            <Select
              value={draft.status}
              onChange={(v) => onPatch({ status: v as "Aktif" | "NonAktif" })}
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "NonAktif", label: "Non-Aktif" },
              ]}
              accent="violet"
              maxW="max-w-[180px]"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* 4 SBAR fields */}
      {SBAR_FIELDS.map((f) => (
        <SectionGroup
          key={f.key}
          title={`${f.letter} — ${f.label}`}
          desc={f.desc}
          icon={<AlignLeft size={11} />}
          accent={{ bg: f.bg, text: f.color }}
        >
          <Field
            label={`Isi ${f.label}`}
            required={f.key === "situation" || f.key === "recommendation"}
            hint="Pakai placeholder ___ untuk field yang diisi user"
          >
            <TextArea
              value={draft[f.key]}
              onChange={(v) => onPatch({ [f.key]: v } as Partial<SBARTemplate>)}
              rows={4}
              placeholder={`Pasien ___ ...`}
              accent="violet"
            />
          </Field>
        </SectionGroup>
      ))}

      {/* Reminder */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
        <Lightbulb size={13} className="mt-0.5 shrink-0 text-sky-600" />
        <div className="flex-1 text-[10.5px] leading-relaxed text-sky-800">
          <p className="font-semibold">Tips menulis SBAR:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li><strong>S</strong>ituation: To-the-point. Identifikasi pasien + masalah utama saat ini.</li>
            <li><strong>B</strong>ackground: Konteks medis terkait. Riwayat, lab, obat, alergi.</li>
            <li><strong>A</strong>ssessment: Apa yang Anda pikir terjadi. Severity & tren.</li>
            <li><strong>R</strong>ecommendation: Apa yang Anda minta atau sarankan. Action-oriented.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
