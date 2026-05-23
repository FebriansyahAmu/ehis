"use client";

import { MessageCircle, Activity, Target, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionGroup } from "@/components/master/shared";
import type { SdkiItem, SdkiData } from "@/lib/master/sdkiMock";
import ListEditor from "./ListEditor";

interface Props {
  draft: SdkiItem;
  onPatch: (p: Partial<SdkiItem>) => void;
}

const HEAD_SKY     = { bg: "bg-sky-50",     text: "text-sky-700"     };
const HEAD_AMBER   = { bg: "bg-amber-50",   text: "text-amber-700"   };
const HEAD_EMERALD = { bg: "bg-emerald-50", text: "text-emerald-700" };

export default function KlinisTab({ draft, onPatch }: Props) {
  const setDataMayor = (patch: Partial<SdkiData>) => {
    onPatch({ dataMayor: { ...draft.dataMayor, ...patch } });
  };
  const setDataMinor = (patch: Partial<SdkiData>) => {
    onPatch({ dataMinor: { ...draft.dataMinor, ...patch } });
  };

  const isRisiko = draft.jenis === "Risiko";

  return (
    <div className="flex flex-col gap-3">
      {/* Info bar untuk diagnosa Risiko */}
      {isRisiko && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
          <Info size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1 text-[11px] leading-relaxed">
            <p className="font-semibold text-amber-800">Diagnosa Jenis Risiko</p>
            <p className="text-amber-700">
              Diagnosa risiko tidak memerlukan data mayor/minor (gejala belum muncul).
              Cukup definisikan kriteria hasil SLKI sebagai target pencegahan.
            </p>
          </div>
        </div>
      )}

      {/* Data Mayor & Minor (skip untuk Risiko) */}
      {!isRisiko && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <SectionGroup
            title="Data Mayor"
            icon={<Activity size={11} />}
            accent={HEAD_SKY}
            desc="Tanda/gejala wajib (80–100% pasien); minimal salah satu harus ada"
          >
            <div className="flex flex-col gap-3">
              <ListEditor
                label="Subjektif (keluhan pasien)"
                values={draft.dataMayor.subjektif}
                onChange={(v) => setDataMayor({ subjektif: v })}
                accent="sky"
                placeholder="Mis. Mengeluh nyeri"
                dot="bg-sky-400"
                emptyHint="Tidak ada keluhan subjektif wajib"
              />
              <ListEditor
                label="Objektif (temuan klinis)"
                values={draft.dataMayor.objektif}
                onChange={(v) => setDataMayor({ objektif: v })}
                accent="sky"
                placeholder="Mis. Tampak meringis, Frekuensi nadi meningkat"
                dot="bg-sky-500"
                emptyHint="Tidak ada temuan objektif wajib"
              />
            </div>
          </SectionGroup>

          <SectionGroup
            title="Data Minor"
            icon={<MessageCircle size={11} />}
            accent={HEAD_AMBER}
            desc="Tanda/gejala pendukung (sering muncul tapi tidak wajib)"
          >
            <div className="flex flex-col gap-3">
              <ListEditor
                label="Subjektif (keluhan pasien)"
                values={draft.dataMinor.subjektif}
                onChange={(v) => setDataMinor({ subjektif: v })}
                accent="amber"
                placeholder="Mis. Anoreksia, Cepat lelah"
                dot="bg-amber-400"
                emptyHint="Tidak ada keluhan minor"
              />
              <ListEditor
                label="Objektif (temuan klinis)"
                values={draft.dataMinor.objektif}
                onChange={(v) => setDataMinor({ objektif: v })}
                accent="amber"
                placeholder="Mis. TD meningkat, Pola napas berubah"
                dot="bg-amber-500"
                emptyHint="Tidak ada temuan minor"
              />
            </div>
          </SectionGroup>
        </div>
      )}

      {/* Kriteria Hasil SLKI — full width */}
      <SectionGroup
        title="Kriteria Hasil (SLKI)"
        icon={<Target size={11} />}
        accent={HEAD_EMERALD}
        desc="Target outcome yang ingin dicapai — dipakai sebagai indikator evaluasi shift/hari"
      >
        <ListEditor
          label="Kriteria Outcome"
          hint="Idealnya 3–5 kriteria spesifik dan terukur"
          values={draft.kriteriaHasil}
          onChange={(v) => onPatch({ kriteriaHasil: v })}
          accent="emerald"
          placeholder="Mis. Keluhan nyeri menurun (NRS 0–3)"
          dot="bg-emerald-500"
          emptyHint="Belum ada kriteria hasil. Minimal 1 kriteria wajib untuk simpan."
        />

        {/* Hint preview */}
        {draft.kriteriaHasil.length > 0 && (
          <div className={cn(
            "mt-3 rounded-lg border px-3 py-2 text-[10.5px]",
            "border-emerald-200 bg-emerald-50/40",
          )}>
            <p className="font-semibold text-emerald-800">Preview Template Asuhan</p>
            <p className="mt-1 text-emerald-700">
              Saat perawat memilih diagnosa ini, kriteria hasil di atas akan auto-populate ke{" "}
              <code className="rounded bg-white px-1 font-mono">AsuhanFormState.kriteriaHasil</code>.
            </p>
          </div>
        )}
      </SectionGroup>
    </div>
  );
}
