"use client";

import { Plus, Beaker, Hash, Type, AlertOctagon } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  type LabTestRecord, type LabParameterRow, emptyLabParameter,
} from "@/lib/master/labTestCatalog";
import LabParameterEditor from "../LabParameterEditor";

interface Props {
  draft: LabTestRecord;
  onPatch: (p: Partial<LabTestRecord>) => void;
}

/** Sinkron `urutan` dengan posisi array (sumber urutan = urutan array). */
function reindex(params: LabParameterRow[]): LabParameterRow[] {
  return params.map((p, i) => (p.urutan === i ? p : { ...p, urutan: i }));
}

export default function LabParameterTab({ draft, onPatch }: Props) {
  const params = draft.parameters;

  const patchParam = (id: string, patch: Partial<LabParameterRow>) =>
    onPatch({ parameters: params.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  const addParam = () =>
    onPatch({ parameters: reindex([...params, emptyLabParameter(params.length)]) });

  const removeParam = (id: string) =>
    onPatch({ parameters: reindex(params.filter((p) => p.id !== id)) });

  const moveParam = (id: string, dir: -1 | 1) => {
    const idx = params.findIndex((p) => p.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= params.length) return;
    const copy = [...params];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onPatch({ parameters: reindex(copy) });
  };

  const numerik = params.filter((p) => p.tipeHasil === "Numerik").length;
  const kualitatif = params.length - numerik;
  const kritis = params.filter((p) => p.criticalLow !== undefined || p.criticalHigh !== undefined).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Info + summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
        <p className="text-[11px] text-emerald-700">
          Tiap parameter (analit) punya <strong>satuan</strong> & <strong>nilai rujukan</strong> sendiri.
          Tes panel (mis. Darah Rutin) memuat banyak parameter; tes tunggal cukup satu.
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Chip icon={Hash} tone="sky" label={`${numerik} numerik`} />
          <Chip icon={Type} tone="violet" label={`${kualitatif} kualitatif`} />
          {kritis > 0 && <Chip icon={AlertOctagon} tone="rose" label={`${kritis} kritis`} />}
        </div>
      </div>

      {/* Daftar parameter */}
      {params.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center">
          <Beaker size={20} className="text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">Belum ada parameter</p>
          <p className="text-[11px] text-slate-400">Tambahkan minimal satu parameter untuk tes ini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {params.map((p, i) => (
              <LabParameterEditor
                key={p.id}
                param={p}
                index={i}
                total={params.length}
                onPatch={(patch) => patchParam(p.id, patch)}
                onRemove={() => removeParam(p.id)}
                onMove={(dir) => moveParam(p.id, dir)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <button
        type="button"
        onClick={addParam}
        className="flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-sky-300 px-3.5 py-2 text-xs font-semibold text-sky-600 transition hover:border-sky-400 hover:bg-sky-50"
      >
        <Plus size={13} /> Tambah Parameter
      </button>
    </div>
  );
}

function Chip({
  icon: Icon, label, tone,
}: {
  icon: typeof Hash; label: string; tone: "sky" | "violet" | "rose";
}) {
  const cls = {
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    rose: "bg-rose-100 text-rose-700",
  }[tone];
  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}
