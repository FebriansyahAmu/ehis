"use client";

import { useMemo } from "react";
import { Zap, Eye, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";
import {
  type QuickTextTemplate, type QuickTextKategori,
  QUICKTEXT_KAT_CFG,
} from "@/lib/master/templateFormMock";

interface Props {
  draft: QuickTextTemplate;
  onPatch: (patch: Partial<QuickTextTemplate>) => void;
  existingShortcuts: string[];
}

export default function QuickTextPane({ draft, onPatch, existingShortcuts }: Props) {
  const shortcutError = useMemo(() => {
    const s = draft.shortcut.trim();
    if (!s) return "Shortcut wajib diisi";
    if (!s.startsWith("/")) return "Shortcut harus diawali /";
    if (s.length < 2) return "Shortcut minimal 2 karakter (mis. /n)";
    if (/\s/.test(s)) return "Shortcut tidak boleh ada spasi";
    if (existingShortcuts.includes(s)) return "Shortcut sudah dipakai template lain";
    return "";
  }, [draft.shortcut, existingShortcuts]);

  const wordCount = draft.expansion.trim().split(/\s+/).filter(Boolean).length;
  const charCount = draft.expansion.length;
  const cfg = QUICKTEXT_KAT_CFG[draft.kategori];

  return (
    <div className="flex flex-col gap-4">
      {/* Identitas */}
      <SectionGroup
        title="Identitas Quick-text"
        icon={<Zap size={11} />}
        accent={{ bg: "bg-amber-50", text: "text-amber-700" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Label" required hint="Nama tampil di picker quick-text">
            <TextInput
              value={draft.label}
              onChange={(v) => onPatch({ label: v })}
              placeholder="mis. Pemeriksaan Thorax Normal"
              accent="amber"
              maxW="max-w-md"
            />
          </Field>

          <Field label="Shortcut" required hint={shortcutError || "Diawali / · tanpa spasi · contoh: /normal-thorax"}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft.shortcut}
                onChange={(e) => onPatch({ shortcut: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                placeholder="/normal-thorax"
                className={cn(
                  "w-full max-w-[260px] rounded-md border bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 outline-none transition",
                  shortcutError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-200"
                    : "border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200",
                )}
              />
              {shortcutError && <AlertCircle size={13} className="shrink-0 text-rose-500" />}
            </div>
          </Field>

          <Field label="Kategori" required>
            <Select
              value={draft.kategori}
              onChange={(v) => onPatch({ kategori: v as QuickTextKategori })}
              options={Object.entries(QUICKTEXT_KAT_CFG).map(([k, c]) => ({
                value: k as QuickTextKategori,
                label: c.label,
              }))}
              accent="amber"
              maxW="max-w-xs"
            />
          </Field>

          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => onPatch({ status: v as "Aktif" | "NonAktif" })}
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "NonAktif", label: "Non-Aktif" },
              ]}
              accent="amber"
              maxW="max-w-[180px]"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Deskripsi" hint="Penjelasan singkat (opsional)">
              <TextInput
                value={draft.deskripsi ?? ""}
                onChange={(v) => onPatch({ deskripsi: v })}
                placeholder="mis. Status paru/jantung normal lengkap"
                accent="amber"
                maxW="max-w-2xl"
              />
            </Field>
          </div>
        </div>
      </SectionGroup>

      {/* Expansion */}
      <SectionGroup
        title="Teks Expansion"
        desc="Teks lengkap yang akan menggantikan shortcut saat user mengetik di CPPT"
        icon={<Zap size={11} />}
        accent={{ bg: "bg-amber-50", text: "text-amber-700" }}
      >
        <Field label="Expansion" required>
          <TextArea
            value={draft.expansion}
            onChange={(v) => onPatch({ expansion: v })}
            placeholder="mis. Inspeksi: bentuk dan gerak dinding dada simetris. Palpasi: fremitus taktil simetris..."
            rows={6}
            accent="amber"
          />
        </Field>
        <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
          <span><strong className="text-slate-700">{wordCount}</strong> kata</span>
          <span><strong className="text-slate-700">{charCount}</strong> karakter</span>
        </div>
      </SectionGroup>

      {/* Preview */}
      <SectionGroup
        title="Preview Penggunaan"
        icon={<Eye size={11} />}
        accent={{ bg: "bg-slate-50", text: "text-slate-700" }}
      >
        <div className="space-y-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-slate-500">
              Dokter mengetik di CPPT:
            </p>
            <p className="font-mono text-xs text-slate-700">
              {draft.shortcut || "/shortcut"}
              <span className="ml-1 inline-block h-3.5 w-px animate-pulse bg-slate-400 align-middle" />
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
            <p className="mb-1 flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-amber-700">
              <Zap size={9} /> Auto-expand menjadi:
            </p>
            {draft.expansion ? (
              <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-800">
                {draft.expansion}
              </p>
            ) : (
              <p className="text-[11px] italic text-slate-400">(Expansion masih kosong)</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="font-semibold">Kategori:</span>
            <span className={cn("rounded px-1.5 py-0.5 font-bold uppercase", cfg.bg, cfg.text)}>
              {cfg.label}
            </span>
          </div>
        </div>
      </SectionGroup>

      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
        <Lightbulb size={13} className="mt-0.5 shrink-0 text-sky-600" />
        <p className="flex-1 text-[10.5px] leading-relaxed text-sky-800">
          <strong>Tips:</strong> Pakai shortcut singkat tapi descriptive (mis. <code className="rounded bg-white px-1">/normal-thorax</code> bukan <code className="rounded bg-white px-1">/nt</code>). Quick-text mengurangi waktu tulis CPPT 60–80% untuk frasa standar yang berulang.
        </p>
      </div>
    </div>
  );
}
