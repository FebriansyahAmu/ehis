"use client";

import {
  AlertCircle, FileText, Clock, TrendingUp, TrendingDown, ActivitySquare, Crosshair,
} from "lucide-react";
import {
  Field, TextInput, TextArea, SectionGroup,
} from "@/components/master/shared";
import type { TemplateAnamnesisItem } from "@/lib/master/templateAnamnesisMock";

interface Props {
  draft: TemplateAnamnesisItem;
  onPatch: <K extends keyof TemplateAnamnesisItem>(k: K, v: TemplateAnamnesisItem[K]) => void;
}

export default function KontenTab({ draft, onPatch }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Keluhan utama + RPS */}
      <SectionGroup
        title="Anamnesis Utama"
        icon={<AlertCircle size={11} />}
        accent={{ bg: "bg-rose-50", text: "text-rose-700" }}
      >
        <Field label="Keluhan Utama" required hint="Singkat, 1-2 baris. Placeholder pakai ___ atau __ untuk field yang diisi user.">
          <TextInput
            value={draft.keluhanUtama}
            onChange={(v) => onPatch("keluhanUtama", v)}
            placeholder="mis. Nyeri dada kiri menjalar ke lengan kiri"
            accent="teal"
            maxW="max-w-2xl"
          />
        </Field>

        <Field label="Riwayat Penyakit Sekarang (RPS)" required hint="Narasi lengkap. Pakai placeholder ___ untuk field yang diisi nakes saat dipakai.">
          <TextArea
            value={draft.rps}
            onChange={(v) => onPatch("rps", v)}
            placeholder="Pasien mengeluh ___ sejak ± ___ jam SMRS. Disertai ___ . Tidak ada riwayat ___ ."
            rows={6}
            accent="teal"
          />
        </Field>
      </SectionGroup>

      {/* Onset & faktor */}
      <SectionGroup
        title="Onset & Faktor"
        icon={<Clock size={11} />}
        accent={{ bg: "bg-amber-50", text: "text-amber-700" }}
      >
        <Field label="Onset & Durasi" required>
          <TextInput
            value={draft.onsetDurasi}
            onChange={(v) => onPatch("onsetDurasi", v)}
            placeholder="mis. Mendadak, ± 1 jam"
            accent="teal"
            maxW="max-w-md"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Faktor Pemberat" hint="Apa yang membuat kondisi memburuk">
            <TextArea
              value={draft.faktorPemberat}
              onChange={(v) => onPatch("faktorPemberat", v)}
              placeholder="Aktivitas fisik, emosi"
              rows={2}
              accent="teal"
            />
          </Field>
          <Field label="Faktor Pereda" hint="Apa yang membuat kondisi membaik">
            <TextArea
              value={draft.faktorPemerut}
              onChange={(v) => onPatch("faktorPemerut", v)}
              placeholder="Istirahat, nitrogliserin sublingual"
              rows={2}
              accent="teal"
            />
          </Field>
        </div>

        <Field label="Mekanisme Cedera" hint="Khusus kasus trauma (opsional)">
          <TextInput
            value={draft.mekanismeCedera ?? ""}
            onChange={(v) => onPatch("mekanismeCedera", v)}
            placeholder="Benturan langsung / KLL / jatuh dari ketinggian"
            accent="teal"
            maxW="max-w-2xl"
          />
        </Field>
      </SectionGroup>

      {/* Status generalis */}
      <SectionGroup
        title="Status Generalis"
        icon={<ActivitySquare size={11} />}
        accent={{ bg: "bg-sky-50", text: "text-sky-700" }}
      >
        <Field label="Status Generalis" required hint="Tampilan umum pasien saat asesmen">
          <TextArea
            value={draft.statusGeneralis}
            onChange={(v) => onPatch("statusGeneralis", v)}
            placeholder="Tampak sakit sedang, kompos mentis, akral dingin, diaforesis"
            rows={3}
            accent="teal"
          />
        </Field>
      </SectionGroup>
    </div>
  );
}
