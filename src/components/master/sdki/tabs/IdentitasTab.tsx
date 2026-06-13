"use client";

import { IdCard, Tag, Layers, ToggleRight, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, TextArea, Select, ToggleSwitch, ChipToggle, SectionGroup,
} from "@/components/master/shared";
import type {
  SdkiItem, SdkiJenis, SdkiStatus,
} from "@/lib/master/sdkiMock";
import {
  KATEGORI_CFG, KATEGORI_LIST, JENIS_CFG, JENIS_LIST,
} from "../sdkiShared";

interface Props {
  draft: SdkiItem;
  onPatch: (p: Partial<SdkiItem>) => void;
}

const HEAD_ROSE   = { bg: "bg-rose-50",   text: "text-rose-700"   };
const HEAD_VIOLET = { bg: "bg-violet-50", text: "text-violet-700" };
const HEAD_SLATE  = { bg: "bg-slate-50",  text: "text-slate-700"  };

const STATUS_OPTS: { value: SdkiStatus; label: string }[] = [
  { value: "Aktif",     label: "Aktif" },
  { value: "Non_Aktif", label: "Non-Aktif" },
];

export default function IdentitasTab({ draft, onPatch }: Props) {
  const isRisiko = draft.jenis === "Risiko";

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* Identitas Dasar */}
      <SectionGroup title="Identitas Diagnosa" icon={<IdCard size={11} />} accent={HEAD_ROSE}>
        <div className="flex flex-col gap-3">
          <Field label="Kode SDKI" hint="Dibuat otomatis (D.NNNN) saat disimpan — tidak dapat diubah.">
            <div className="flex h-9 max-w-55 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3">
              <Hash size={12} className="shrink-0 text-slate-400" />
              {draft.kode ? (
                <span className="font-mono text-xs font-semibold text-slate-700">{draft.kode}</span>
              ) : (
                <span className="text-[11px] italic text-slate-400">Otomatis saat disimpan</span>
              )}
              <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Auto
              </span>
            </div>
          </Field>
          <Field label="Nama Diagnosa" required>
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="Mis. Nyeri Akut, Bersihan Jalan Napas Tidak Efektif"
              accent="rose"
            />
          </Field>
          <Field label="Penyebab Umum" hint="Daftar penyebab paling sering (untuk auto-populate template)">
            <TextArea
              value={draft.penyebabUmum}
              onChange={(v) => onPatch({ penyebabUmum: v })}
              placeholder="Mis. Agen pencedera fisik (prosedur invasif, trauma, pembedahan), biologis, kimiawi"
              rows={3}
              accent="rose"
            />
          </Field>
          {isRisiko && (
            <Field label="Faktor Risiko" hint="Khusus diagnosa jenis 'Risiko' — daftar faktor yang dapat menimbulkan masalah">
              <TextArea
                value={draft.faktorResiko ?? ""}
                onChange={(v) => onPatch({ faktorResiko: v })}
                placeholder="Mis. Usia lanjut, kelemahan, penggunaan alat bantu, riwayat jatuh, obat-obatan"
                rows={2}
                accent="amber"
              />
            </Field>
          )}
        </div>
      </SectionGroup>

      {/* Klasifikasi */}
      <SectionGroup title="Klasifikasi" icon={<Layers size={11} />} accent={HEAD_VIOLET}>
        <div className="flex flex-col gap-3">
          <Field label="Kategori SDKI" required>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {KATEGORI_LIST.map((k) => {
                const cfg = KATEGORI_CFG[k];
                const active = draft.kategori === k;
                const Icon = cfg.icon;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onPatch({ kategori: k })}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition",
                      active
                        ? cn(cfg.bg, "border-current ring-1 ring-current")
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <Icon size={13} className={active ? cfg.text : "text-slate-400"} />
                    <span className={cn("text-[11px] font-semibold", active ? cfg.text : "text-slate-700")}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Jenis Diagnosa" required>
            <Select<SdkiJenis>
              value={draft.jenis}
              onChange={(v) => v && onPatch({ jenis: v })}
              options={JENIS_LIST.map((j) => ({ value: j, label: JENIS_CFG[j].label }))}
              maxW="max-w-[260px]"
              accent="violet"
            />
          </Field>

          <Field label="Sub-Kategori" hint="Mis. Respirasi, Sirkulasi, Nutrisi/Cairan, Integumen">
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-slate-400" />
              <TextInput
                value={draft.subKategori}
                onChange={(v) => onPatch({ subKategori: v })}
                placeholder="Respirasi"
                maxW="max-w-[260px]"
                accent="violet"
              />
            </div>
          </Field>
        </div>
      </SectionGroup>

      {/* Status — full width */}
      <div className="lg:col-span-2">
        <SectionGroup title="Status" icon={<ToggleRight size={11} />} accent={HEAD_SLATE}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Status">
              <ChipToggle<SdkiStatus>
                value={draft.status}
                onChange={(v) => onPatch({ status: v })}
                options={STATUS_OPTS}
                accent="rose"
              />
            </Field>
            <ToggleSwitch
              value={draft.status === "Aktif"}
              onChange={(v) => onPatch({ status: v ? "Aktif" : "Non_Aktif" })}
              accent="emerald"
              label="Diagnosa Aktif untuk Workflow"
              desc="Hanya diagnosa aktif yang muncul di KeperawatanTab template. Histori asuhan tetap terlihat."
            />
          </div>
        </SectionGroup>
      </div>

    </div>
  );
}
