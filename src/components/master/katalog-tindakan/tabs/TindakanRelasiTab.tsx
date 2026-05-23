"use client";

import { motion } from "framer-motion";
import { Network } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TindakanRecord } from "@/lib/master/tindakanMock";
import { CLINICAL_UNITS_FOR_LAYANAN } from "@/lib/master/tindakanMock";
import type { SpesialisCode } from "@/components/master/dokter/dokterShared";
import { SPESIALIS_ORDER, SPESIALIS_SHORT } from "../katalogTindakanShared";

interface Props {
  draft: TindakanRecord;
  onPatch: (patch: Partial<TindakanRecord>) => void;
}

const UNIT_CATEGORIES = ["Klinis", "Poli", "Penunjang"] as const;

export default function TindakanRelasiTab({ draft, onPatch }: Props) {
  const toggleSpesialis = (code: SpesialisCode) => {
    const next = draft.spesialisDefault.includes(code)
      ? draft.spesialisDefault.filter((c) => c !== code)
      : [...draft.spesialisDefault, code];
    onPatch({ spesialisDefault: next });
  };

  const toggleUnit = (kode: string) => {
    const next = draft.unitDefault.includes(kode)
      ? draft.unitDefault.filter((c) => c !== kode)
      : [...draft.unitDefault, kode];
    onPatch({ unitDefault: next });
  };

  const unitByCategory = CLINICAL_UNITS_FOR_LAYANAN.reduce<
    Record<string, typeof CLINICAL_UNITS_FOR_LAYANAN>
  >((acc, u) => {
    if (!acc[u.category]) acc[u.category] = [];
    acc[u.category].push(u);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3">
        <Network size={14} className="mt-0.5 shrink-0 text-sky-500" />
        <p className="text-[11px] text-sky-800 leading-relaxed">
          Nilai ini dipakai sebagai <strong>seed awal</strong> di{" "}
          <strong>Mapping Hub → Kewenangan Klinis</strong> dan{" "}
          <strong>Layanan Unit</strong> saat tindakan ditambahkan. Admin tetap dapat
          mengubah relasi di Mapping Hub.
        </p>
      </div>

      {/* Spesialis */}
      <RelasiSection
        title="Spesialis Berwenang Default"
        count={draft.spesialisDefault.length}
      >
        {SPESIALIS_ORDER.map((code) => (
          <RelasiChip
            key={code}
            label={SPESIALIS_SHORT[code]}
            title={code}
            active={draft.spesialisDefault.includes(code)}
            onClick={() => toggleSpesialis(code)}
          />
        ))}
      </RelasiSection>

      {/* Unit Default */}
      <RelasiSection
        title="Unit Layanan Default"
        count={draft.unitDefault.length}
      >
        <div className="flex w-full flex-col gap-3">
          {UNIT_CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {cat}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(unitByCategory[cat] ?? []).map((u) => (
                  <RelasiChip
                    key={u.kode}
                    label={u.short}
                    title={u.nama}
                    active={draft.unitDefault.includes(u.kode)}
                    onClick={() => toggleUnit(u.kode)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </RelasiSection>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function RelasiSection({
  title, count, children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        <p className="text-xs font-bold text-slate-700">{title}</p>
        <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
          {count} dipilih
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-3">{children}</div>
    </div>
  );
}

function RelasiChip({
  label, title, active, onClick,
}: {
  label: string;
  title?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={title}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-200",
        active
          ? "border-teal-200 bg-teal-50 text-teal-800 ring-1 ring-teal-100"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {label}
    </motion.button>
  );
}
