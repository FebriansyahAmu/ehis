"use client";

import { Workflow, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionGroup } from "@/components/master/shared";
import type { SdkiItem, SdkiIntervensi } from "@/lib/master/sdkiMock";
import { countSdkiIntervensi } from "@/lib/master/sdkiMock";
import { SIKI_GROUPS } from "../sdkiShared";
import ListEditor from "./ListEditor";

interface Props {
  draft: SdkiItem;
  onPatch: (p: Partial<SdkiItem>) => void;
}

const HEAD_VIOLET = { bg: "bg-violet-50", text: "text-violet-700" };

export default function IntervensiTab({ draft, onPatch }: Props) {
  const setIntervensi = (key: keyof SdkiIntervensi, values: string[]) => {
    onPatch({ intervensi: { ...draft.intervensi, [key]: values } });
  };

  const total = countSdkiIntervensi(draft);

  return (
    <div className="flex flex-col gap-3">
      {/* Info bar */}
      <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2">
        <Info size={13} className="mt-0.5 shrink-0 text-violet-600" />
        <div className="flex-1 text-[11px] leading-relaxed">
          <p className="font-semibold text-violet-800">Intervensi SIKI (PPNI 2018)</p>
          <p className="text-violet-700">
            Definisikan intervensi keperawatan terstandar dalam 4 sub-kategori. Total{" "}
            <strong className="font-mono">{total}</strong> intervensi akan auto-populate ke template asuhan saat
            diagnosa ini dipilih oleh perawat di KeperawatanTab RI.
          </p>
        </div>
      </div>

      {/* 4 sub-kategori SIKI dalam 2-column grid */}
      <SectionGroup
        title="Intervensi SIKI per Sub-Kategori"
        icon={<Workflow size={11} />}
        accent={HEAD_VIOLET}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {SIKI_GROUPS.map((group) => {
            const values = draft.intervensi[group.key];
            return (
              <SikiGroupCard
                key={group.key}
                title={group.label}
                hint={group.hint}
                bg={group.bg}
                text={group.text}
                count={values.length}
              >
                <ListEditor
                  label={group.label}
                  values={values}
                  onChange={(v) => setIntervensi(group.key, v)}
                  accent={group.accent}
                  placeholder={`Mis. intervensi ${group.label.toLowerCase()}…`}
                  dot={group.bg.replace("bg-", "bg-").replace("-50", "-500")}
                  emptyHint={`Belum ada intervensi ${group.label.toLowerCase()}. Opsional.`}
                />
              </SikiGroupCard>
            );
          })}
        </div>
      </SectionGroup>
    </div>
  );
}

// ── Sub-card per SIKI group ──────────────────────────────

function SikiGroupCard({
  title, hint, bg, text, count, children,
}: {
  title: string;
  hint: string;
  bg: string;
  text: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <header className={cn("flex items-center justify-between rounded-t-xl border-b border-slate-100 px-3 py-2", bg)}>
        <div className="min-w-0">
          <p className={cn("text-[11px] font-bold uppercase tracking-wide", text)}>{title}</p>
          <p className={cn("mt-0.5 text-[9.5px]", text, "opacity-70")}>{hint}</p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
          count > 0 ? cn("bg-white", text) : "bg-white text-slate-400",
        )}>
          {count}
        </span>
      </header>
      <div className="p-3">{children}</div>
    </div>
  );
}
