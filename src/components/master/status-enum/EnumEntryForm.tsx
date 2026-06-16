"use client";

import { useState } from "react";
import { Save, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, NumberInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";
import {
  type EnumEntry,
  TONE_CFG, TONE_LIST, ICON_KEYS, ICON_REGISTRY,
} from "@/lib/master/statusEnumMock";

interface Props {
  initial: EnumEntry;
  onSave: (entry: EnumEntry) => void;
  onCancel: () => void;
  /** Prefix kode grup (utk hint auto-gen saat create). */
  prefix: string;
  busy?: boolean;
  mode: "create" | "edit";
}

export default function EnumEntryForm({
  initial, onSave, onCancel, prefix, busy = false, mode,
}: Props) {
  const [draft, setDraft] = useState<EnumEntry>(initial);

  const patch = <K extends keyof EnumEntry>(k: K, v: EnumEntry[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  // Kode AUTO-GEN di server (`<PREFIX>-NNN`, immutable). Tak ada input manual.
  const canSave = draft.label.trim() !== "";

  // Member access (bukan call) → stabil, lolos react-hooks/static-components.
  const Icon = draft.icon ? ICON_REGISTRY[draft.icon] : undefined;
  const toneCfg = TONE_CFG[draft.tone];

  return (
    <div className="rounded-lg border border-violet-200 bg-white p-3 shadow-sm">
      <SectionGroup
        title={mode === "create" ? "Entri Baru" : `Edit: ${initial.label}`}
        accent={{ bg: "bg-violet-50", text: "text-violet-700" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Label */}
          <Field label="Label" required hint="Nama tampil di UI">
            <TextInput
              value={draft.label}
              onChange={(v) => patch("label", v)}
              placeholder="mis. Sembuh"
              accent="violet"
              maxW="max-w-sm"
            />
          </Field>

          {/* Kode — read-only (auto-gen server) */}
          <Field label="Kode" hint="Dibuat otomatis oleh sistem per kategori — tidak dapat diubah">
            <div className="flex items-center gap-1.5">
              {mode === "create" ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-violet-300 bg-violet-50/60 px-2.5 py-1.5 font-mono text-xs font-semibold text-violet-600">
                  <Sparkles size={11} />
                  Auto · {prefix}-NNN
                </span>
              ) : (
                <code className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700">
                  {draft.kode}
                </code>
              )}
            </div>
          </Field>

          {/* Deskripsi — full width */}
          <div className="sm:col-span-2">
            <Field label="Deskripsi" hint="Penjelasan singkat tentang entri ini (opsional)">
              <TextArea
                value={draft.deskripsi ?? ""}
                onChange={(v) => patch("deskripsi", v)}
                placeholder="mis. Pulang dalam kondisi sembuh penuh tanpa keluhan"
                rows={2}
                accent="violet"
              />
            </Field>
          </div>

          {/* Tone */}
          <Field label="Tone Warna" hint="Warna chip badge di list workflow">
            <div className="flex flex-wrap gap-1">
              {TONE_LIST.map((t) => {
                const cfg = TONE_CFG[t];
                const active = draft.tone === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => patch("tone", t)}
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-semibold transition",
                      active
                        ? cn(cfg.chip, "border-current ring-1", cfg.ring)
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                    aria-label={`Tone ${cfg.label}`}
                  >
                    <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Icon picker */}
          <Field label="Icon" hint="Ikon Lucide untuk badge (opsional)">
            <Select
              value={draft.icon ?? ""}
              onChange={(v) => patch("icon", v || undefined)}
              options={[
                { value: "", label: "— Tanpa ikon —" },
                ...ICON_KEYS.map((k) => ({ value: k, label: k })),
              ]}
              accent="violet"
              maxW="max-w-[200px]"
            />
          </Field>

          {/* Urutan */}
          <Field label="Urutan" hint="Posisi tampil di list (kecil = atas)">
            <NumberInput
              value={draft.urutan}
              onChange={(v) => patch("urutan", v ?? 1)}
              min={1}
              max={99}
              accent="violet"
              maxW="max-w-[100px]"
            />
          </Field>

          {/* Status */}
          <Field label="Status" hint="Non-aktif menyembunyikan entri dari workflow">
            <Select
              value={draft.status}
              onChange={(v) => patch("status", v as "Aktif" | "NonAktif")}
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "NonAktif", label: "Non-Aktif" },
              ]}
              accent="violet"
              maxW="max-w-[160px]"
            />
          </Field>
        </div>

        {/* Live preview */}
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Preview</p>
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold", toneCfg.chip, "ring-1", toneCfg.ring)}>
              {Icon && <Icon size={11} />}
              {draft.label || "(label kosong)"}
            </span>
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
              {mode === "create" ? `${prefix}-…` : draft.kode}
            </code>
            {draft.status === "NonAktif" && (
              <span className="rounded-full bg-slate-200 px-1.5 text-[9px] font-bold uppercase text-slate-600">off</span>
            )}
          </div>
          {draft.deskripsi && (
            <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500">{draft.deskripsi}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <X size={11} className="mr-1 inline" />
            Batal
          </button>
          <button
            type="button"
            onClick={() => canSave && !busy && onSave(draft)}
            disabled={!canSave || busy}
            className={cn(
              "flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition",
              canSave && !busy
                ? "bg-violet-600 hover:bg-violet-700"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            <Save size={11} />
            {busy ? "Menyimpan…" : mode === "create" ? "Tambah" : "Simpan Perubahan"}
          </button>
        </div>
      </SectionGroup>
    </div>
  );
}
