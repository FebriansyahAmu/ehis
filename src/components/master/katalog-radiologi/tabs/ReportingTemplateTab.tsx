"use client";

import { motion } from "framer-motion";
import { FileText, LayoutList, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RadCatalogRecord, ReportingTemplate } from "@/lib/master/radCatalogMock";
import { Field, TextArea, SectionGroup } from "@/components/master/shared";

interface Props {
  draft: RadCatalogRecord;
  onPatch: (p: Partial<RadCatalogRecord>) => void;
}

const STRUKTUR_DEFAULT = [
  "Indikasi Klinis", "Teknik Pemeriksaan", "Temuan", "Kesan", "Saran",
];

export default function ReportingTemplateTab({ draft, onPatch }: Props) {
  const template = draft.reportingTemplate;

  const patchTemplate = (patch: Partial<ReportingTemplate>) =>
    onPatch({ reportingTemplate: { ...template, ...patch } });

  const useDefault = () => patchTemplate({ struktur: STRUKTUR_DEFAULT });

  const isCustom =
    template.struktur.length !== STRUKTUR_DEFAULT.length ||
    template.struktur.some((s, i) => s !== STRUKTUR_DEFAULT[i]);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* ── LEFT: Editor ──────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <SectionGroup
          title="Struktur Section Laporan"
          icon={<LayoutList size={11} />}
          accent={{ bg: "bg-sky-50/60", text: "text-sky-700" }}
          desc="Header bagian yang muncul di laporan akhir SpRad"
          action={
            isCustom && (
              <button
                type="button"
                onClick={useDefault}
                className="rounded border border-sky-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Pakai Default
              </button>
            )
          }
        >
          <ol className="flex flex-col gap-1.5">
            {template.struktur.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-50 text-[10px] font-bold text-sky-700">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={s}
                  onChange={(e) => {
                    const next = [...template.struktur];
                    next[i] = e.target.value;
                    patchTemplate({ struktur: next });
                  }}
                  className="flex-1 bg-transparent text-[12px] font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:text-slate-900"
                />
              </motion.li>
            ))}
          </ol>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            Standar ACR/RSNA: 5 section. Edit langsung pada baris di atas untuk customize.
          </p>
        </SectionGroup>

        <SectionGroup
          title="Template Temuan Terstruktur"
          icon={<FileText size={11} />}
          accent={{ bg: "bg-violet-50/60", text: "text-violet-700" }}
          desc="Boilerplate teks untuk bagian Temuan — SpRad cukup melengkapi placeholder"
        >
          <Field label="Template Bagian Temuan">
            <TextArea
              value={template.templateTemuan ?? ""}
              onChange={(v) => patchTemplate({ templateTemuan: v })}
              rows={10}
              monospace
              placeholder={`Contoh untuk CT Thorax:
Trakea & bronkus utama: paten.
Parenkim paru: (sebutkan lesi/konsolidasi).
Mediastinum: limfonodi (jumlah & ukuran).
Pleura: efusi / penebalan.
Tulang & soft tissue: (sebutkan).`}
            />
          </Field>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            Gunakan kalimat per baris. Tanda <code className="rounded bg-slate-100 px-1 font-mono text-[9px]">(sebutkan)</code> menunjukkan
            placeholder yang harus diisi SpRad saat expertise.
          </p>
        </SectionGroup>
      </div>

      {/* ── RIGHT: Live Preview ──────────────────────────── */}
      <div className="flex flex-col gap-3">
        <SectionGroup
          title="Preview Laporan"
          icon={<Eye size={11} />}
          accent={{ bg: "bg-emerald-50/60", text: "text-emerald-700" }}
          desc="Tampilan struktur saat dipakai di EkspertasiPane"
        >
          <ReportPreview draft={draft} />
        </SectionGroup>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <div className="flex items-start gap-2">
            <Sparkles size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-amber-800">Tips Reporting Berkualitas</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-3.5 text-[10.5px] leading-relaxed text-amber-700">
                <li>Gunakan terminologi standar (mis. BI-RADS untuk mammae, TI-RADS untuk tiroid).</li>
                <li>Selalu sebutkan lokasi & ukuran lesi (cm, jam pada mammae, lobus pada paru).</li>
                <li>Hindari ungkapan ambiguous: &quot;dalam batas normal&quot; vs &quot;tidak tampak kelainan&quot;.</li>
                <li>Kesan = sintesis temuan; Saran = follow-up imaging / klinis / korelasi.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Live Preview Sub-component ───────────────────────────

function ReportPreview({ draft }: { draft: RadCatalogRecord }) {
  const { struktur, templateTemuan } = draft.reportingTemplate;
  const namaPemeriksaan = draft.nama || "Pemeriksaan Radiologi";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
      {/* Print-ish header */}
      <div className="mb-3 border-b border-dashed border-slate-300 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Laporan Radiologi
        </p>
        <h4 className="mt-0.5 text-xs font-bold text-slate-800">{namaPemeriksaan}</h4>
        {draft.kode && (
          <p className="font-mono text-[10px] text-slate-400">{draft.kode}</p>
        )}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-2.5">
        {struktur.map((section, i) => {
          const isTemuan = section.toLowerCase().includes("temuan");
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-wide",
                isTemuan ? "text-violet-700" : "text-slate-600",
              )}>
                {section}
              </p>
              {isTemuan && templateTemuan ? (
                <pre className="mt-1 whitespace-pre-wrap rounded border border-violet-100 bg-white p-2 font-sans text-[10.5px] leading-relaxed text-slate-700">
                  {templateTemuan}
                </pre>
              ) : (
                <div className="mt-1 h-5 rounded bg-slate-100/80" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer signature placeholder */}
      <div className="mt-4 flex items-end justify-end border-t border-dashed border-slate-200 pt-2">
        <div className="text-right">
          <div className="h-5 w-32 rounded bg-slate-100/80" />
          <p className="mt-1 text-[9px] text-slate-400">SpRad penanggung jawab</p>
        </div>
      </div>
    </div>
  );
}
