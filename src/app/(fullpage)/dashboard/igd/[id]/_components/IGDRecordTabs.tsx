"use client";

import { useState } from "react";
import { ClipboardList, HeartPulse, Stethoscope, Tag, FileText, Zap, LogOut } from "lucide-react";
import type { IGDPatientDetail } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

import TriaseTab       from "./tabs/TriaseTab";
import TTVTab          from "./tabs/TTVTab";
import AsesmenMedisTab from "./tabs/AsesmenMedisTab";
import DiagnosaTab     from "./tabs/DiagnosaTab";
import CPPTTab         from "./tabs/CPPTTab";
import TindakanTab     from "./tabs/TindakanTab";
import DisposisiTab    from "./tabs/DisposisiTab";

const TABS = [
  { id: "triase",    label: "Triase",        icon: ClipboardList },
  { id: "ttv",       label: "TTV",           icon: HeartPulse    },
  { id: "asesmen",   label: "Asesmen Medis", icon: Stethoscope   },
  { id: "diagnosa",  label: "Diagnosa",      icon: Tag           },
  { id: "cppt",      label: "CPPT / SOAP",   icon: FileText      },
  { id: "tindakan",  label: "Tindakan IGD",  icon: Zap           },
  { id: "disposisi", label: "Disposisi",     icon: LogOut        },
] as const;

type TabId = typeof TABS[number]["id"];

export default function IGDRecordTabs({ patient }: { patient: IGDPatientDetail }) {
  const [active, setActive] = useState<TabId>("triase");

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

      {/* ── Mobile: horizontal scrollable tab bar ── */}
      <nav
        className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 md:hidden"
        aria-label="Navigasi rekam medis"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "my-1.5 flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-semibold transition",
              active === id
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}
            aria-current={active === id ? "page" : undefined}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Desktop: vertical left nav ── */}
      <nav
        className="hidden w-48 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 py-3 md:block"
        aria-label="Navigasi rekam medis"
      >
        <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Rekam Medis
        </p>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "mx-2 flex w-[calc(100%-16px)] items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
              active === id
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800",
            )}
            aria-current={active === id ? "page" : undefined}
          >
            <Icon
              size={15}
              className={active === id ? "text-indigo-500" : "text-slate-400"}
              aria-hidden="true"
            />
            {label}
            {active === id && (
              <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            )}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5">
        {active === "triase"    && <TriaseTab       patient={patient} />}
        {active === "ttv"       && <TTVTab          patient={patient} />}
        {active === "asesmen"   && <AsesmenMedisTab patient={patient} />}
        {active === "diagnosa"  && <DiagnosaTab     patient={patient} />}
        {active === "cppt"      && <CPPTTab         patient={patient} />}
        {active === "tindakan"  && <TindakanTab     patient={patient} />}
        {active === "disposisi" && <DisposisiTab    patient={patient} />}
      </main>
    </div>
  );
}
