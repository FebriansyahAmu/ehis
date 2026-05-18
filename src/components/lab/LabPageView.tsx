"use client";

import { useState } from "react";
import { FlaskConical, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LabBoard         from "./LabBoard";
import LabManajemenTabs from "./LabManajemenTabs";

type View = "worklist" | "manajemen";

export default function LabPageView() {
  const [view, setView] = useState<View>("worklist");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 w-fit shadow-sm">
        {([
          { key: "worklist",  label: "Worklist Order",  icon: FlaskConical },
          { key: "manajemen", label: "QC & Manajemen",  icon: Settings2    },
        ] as { key: View; label: string; icon: typeof FlaskConical }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-all duration-150",
              view === key
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {view === "worklist"  && <LabBoard />}
      {view === "manajemen" && <LabManajemenTabs />}
    </div>
  );
}
