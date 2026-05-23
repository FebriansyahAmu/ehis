"use client";

import { IdCard, BookOpen, ToggleRight } from "lucide-react";
import {
  Field, TextInput, TextArea, ToggleSwitch, SectionGroup,
} from "@/components/master/shared";
import type { TriaseRecord, TriaseStatus } from "@/lib/master/triaseMock";

interface Props {
  draft: TriaseRecord;
  onPatch: (p: Partial<TriaseRecord>) => void;
}

const HEAD_AMBER = { bg: "bg-amber-50", text: "text-amber-700" };
const HEAD_SLATE = { bg: "bg-slate-50", text: "text-slate-700" };

export default function IdentitasTab({ draft, onPatch }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* Identitas Dasar */}
      <SectionGroup
        title="Identitas Protokol"
        icon={<IdCard size={11} />}
        accent={HEAD_AMBER}
      >
        <div className="flex flex-col gap-3">
          <Field label="Nama Protokol" required>
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="Mis. Protokol Triase IGD RS X / ESI 5-Level"
              accent="amber"
            />
          </Field>
          <Field label="Kode" required>
            <TextInput
              value={draft.kode}
              onChange={(v) => onPatch({ kode: v.toUpperCase() })}
              placeholder="DEFAULT-IGD · ESI · ATS"
              className="font-mono"
              maxW="max-w-[220px]"
              accent="amber"
            />
          </Field>
          <Field label="Deskripsi" hint="Penjelasan singkat untuk dokter triase">
            <TextArea
              value={draft.deskripsi}
              onChange={(v) => onPatch({ deskripsi: v })}
              placeholder="Penjelasan ringkas protokol — kapan dipakai, basis ilmiah, adaptasi lokal..."
              rows={3}
              accent="amber"
            />
          </Field>
          <Field label="Protokol Referensi">
            <div className="flex items-center gap-1.5">
              <BookOpen size={12} className="text-slate-400" />
              <TextInput
                value={draft.protokol}
                onChange={(v) => onPatch({ protokol: v })}
                placeholder="ESI 5-level (ENA 2020) + DOA · PMK 47/2018"
                accent="amber"
              />
            </div>
          </Field>
        </div>
      </SectionGroup>

      {/* Status */}
      <SectionGroup
        title="Status & Pemakaian"
        icon={<ToggleRight size={11} />}
        accent={HEAD_SLATE}
      >
        <div className="flex flex-col gap-3">
          <ToggleSwitch
            value={draft.status === "Aktif"}
            onChange={(v) => onPatch({ status: (v ? "Aktif" : "Non_Aktif") as TriaseStatus })}
            accent="emerald"
            label="Protokol Aktif"
            desc="Hanya protokol aktif yang muncul di IGD TriaseTab. Hanya boleh satu protokol aktif default per RS."
          />

          {/* Quick summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Ringkasan Matrix
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="font-mono text-base font-black tabular-nums text-slate-800">
                  {draft.levels.length}
                </p>
                <p className="text-[10px] text-slate-500">Level Urgensi</p>
              </div>
              <div>
                <p className="font-mono text-base font-black tabular-nums text-slate-800">
                  {draft.parameters.length}
                </p>
                <p className="text-[10px] text-slate-500">Parameter Kriteria</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Total <strong className="font-mono text-slate-700">{draft.levels.length * draft.parameters.length}</strong> sel matrix · edit di tab Matrix Triase.
            </p>
          </div>
        </div>
      </SectionGroup>
    </div>
  );
}
