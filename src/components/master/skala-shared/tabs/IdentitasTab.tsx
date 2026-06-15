"use client";

import { IdCard, Hash, Network, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, TextArea, Select, ToggleSwitch, ChipToggle, SectionGroup,
  type MasterAccent,
} from "@/components/master/shared";
import type {
  SkalaRecord, SkalaModulKonsumen, SkalaScoringMode, SkalaArah, SkalaStatus,
} from "@/lib/master/skalaCommon";
import { MODUL_CFG, deriveTotalMax, MODUL_LIST_ALL } from "../skalaConfig";

interface Props {
  accent: MasterAccent;
  draft: SkalaRecord;
  onPatch: (p: Partial<SkalaRecord>) => void;
}

const MODE_OPTS: { value: SkalaScoringMode; label: string; desc: string }[] = [
  {
    value: "sum_items",
    label: "Jumlah Skor Item",
    desc: "Total = penjumlahan skor terpilih per item (Barthel, Morse, Braden, MUST)",
  },
  {
    value: "select_value",
    label: "Pilih Satu Nilai",
    desc: "User memilih satu nilai langsung tanpa penjumlahan (NRS Pain, GCS-Total, Kesadaran)",
  },
];

const ARAH_OPTS: { value: SkalaArah; label: string }[] = [
  { value: "higher_is_worse", label: "Skor Tinggi = Risiko Tinggi" },
  { value: "lower_is_worse",  label: "Skor Rendah = Risiko Tinggi (Inverse)" },
];

const STATUS_OPTS: { value: SkalaStatus; label: string }[] = [
  { value: "Aktif",     label: "Aktif" },
  { value: "Non_Aktif", label: "Non-Aktif" },
];

// Per-accent header config (Tailwind purge-safe).
const HEAD_PRIMARY: Record<MasterAccent, { bg: string; text: string }> = {
  rose:    { bg: "bg-rose-50",    text: "text-rose-700"    },
  sky:     { bg: "bg-sky-50",     text: "text-sky-700"     },
  teal:    { bg: "bg-teal-50",    text: "text-teal-700"    },
  violet:  { bg: "bg-violet-50",  text: "text-violet-700"  },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700"   },
  slate:   { bg: "bg-slate-50",   text: "text-slate-700"   },
  pink:    { bg: "bg-pink-50",    text: "text-pink-700"    },
};

const HEAD_EMERALD = { bg: "bg-emerald-50", text: "text-emerald-700" };
const HEAD_VIOLET  = { bg: "bg-violet-50",  text: "text-violet-700"  };
const HEAD_SLATE   = { bg: "bg-slate-50",   text: "text-slate-700"   };

export default function IdentitasTab({ accent, draft, onPatch }: Props) {
  const primary = HEAD_PRIMARY[accent];

  const toggleModul = (m: SkalaModulKonsumen) => {
    const next = draft.konsumenModul.includes(m)
      ? draft.konsumenModul.filter((x) => x !== m)
      : [...draft.konsumenModul, m];
    onPatch({ konsumenModul: next });
  };

  const onModeChange = (mode: SkalaScoringMode | undefined) => {
    if (!mode) return;
    onPatch({
      scoringMode: mode,
      totalMax: deriveTotalMax(draft.items, mode),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* Identitas Dasar */}
      <SectionGroup
        title="Identitas Dasar"
        icon={<IdCard size={11} />}
        accent={primary}
      >
        <div className="flex flex-col gap-3">
          <Field label="Nama Lengkap Skala" required>
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="Mis. Morse Fall Scale"
              accent={accent}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kode" hint="Otomatis saat disimpan">
              <div className="flex h-9 max-w-[180px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-600">
                {draft.kode || <span className="font-sans text-slate-400">Auto</span>}
              </div>
            </Field>
            <Field label="Singkatan / Display">
              <TextInput
                value={draft.singkat}
                onChange={(v) => onPatch({ singkat: v })}
                placeholder="ADL · Risiko Jatuh"
                maxW="max-w-[200px]"
                accent={accent}
              />
            </Field>
          </div>
          <Field label="Deskripsi Singkat" hint="Tampil di list & empty state, max 250 karakter">
            <TextArea
              value={draft.deskripsi}
              onChange={(v) => onPatch({ deskripsi: v.slice(0, 250) })}
              rows={3}
              placeholder="Penjelasan ringkas tujuan skala dan ranah penilaiannya..."
              accent={accent}
            />
          </Field>
          <Field label="Referensi Standar">
            <div className="flex items-center gap-1.5">
              <BookOpen size={12} className="text-slate-400" />
              <TextInput
                value={draft.referensi}
                onChange={(v) => onPatch({ referensi: v })}
                placeholder="Mahoney FI, Barthel DW. Maryland State Med J 1965..."
                accent={accent}
              />
            </div>
          </Field>
        </div>
      </SectionGroup>

      {/* Mode Skoring */}
      <SectionGroup
        title="Mode Skoring & Arah"
        icon={<Hash size={11} />}
        accent={HEAD_EMERALD}
        desc="Cara menghitung total dan interpretasi inverse"
      >
        <div className="flex flex-col gap-3">
          <Field label="Mode Skoring" required>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODE_OPTS.map((opt) => {
                const active = draft.scoringMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onModeChange(opt.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-200",
                      active
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50",
                    )}
                  >
                    <p className={cn(
                      "text-xs font-semibold",
                      active ? "text-emerald-700" : "text-slate-700",
                    )}>
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Arah Skor" hint="Inverse contoh: Braden, GCS (skor rendah = lebih buruk)">
            <Select<SkalaArah>
              value={draft.arah}
              onChange={(v) => v && onPatch({ arah: v })}
              options={ARAH_OPTS}
              maxW="max-w-[320px]"
              accent="emerald"
            />
          </Field>
          <Field label="Total Skor Maksimal" hint="Auto-derived dari Item Skor; ubah item untuk recalc">
            <div className="flex h-9 max-w-[180px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <span className="font-mono text-sm font-black tabular-nums text-slate-800">
                {draft.totalMax}
              </span>
              <span className="text-[10px] text-slate-400">poin maksimum</span>
            </div>
          </Field>
        </div>
      </SectionGroup>

      {/* Konsumen Modul */}
      <SectionGroup
        title="Konsumen Modul"
        icon={<Network size={11} />}
        accent={HEAD_VIOLET}
        desc="Modul klinis yang akan menampilkan skala ini sebagai pilihan"
      >
        <Field label="Pilih Modul" hint="Min 1 modul; muncul sebagai badge di list">
          <div className="flex flex-wrap gap-1.5">
            {MODUL_LIST_ALL.map((m) => {
              const cfg = MODUL_CFG[m];
              const active = draft.konsumenModul.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleModul(m)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-violet-200",
                    active
                      ? cn(cfg.bg, cfg.text, "border-current")
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    active ? cfg.dot : "bg-slate-300",
                  )} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </Field>
      </SectionGroup>

      {/* Status */}
      <SectionGroup
        title="Status"
        icon={<IdCard size={11} />}
        accent={HEAD_SLATE}
      >
        <div className="flex flex-col gap-3">
          <Field label="Status Skala">
            <ChipToggle<SkalaStatus>
              value={draft.status}
              onChange={(v) => onPatch({ status: v })}
              options={STATUS_OPTS}
              accent={accent}
            />
          </Field>
          <ToggleSwitch
            value={draft.status === "Aktif"}
            onChange={(v) => onPatch({ status: v ? "Aktif" : "Non_Aktif" })}
            accent="emerald"
            label="Skala Aktif untuk Workflow"
            desc="Jika non-aktif, skala tidak muncul sebagai pilihan di rekam medis. Histori penilaian sebelumnya tetap terlihat."
          />
        </div>
      </SectionGroup>
    </div>
  );
}
