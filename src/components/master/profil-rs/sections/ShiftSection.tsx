"use client";

import { Sunrise, Sun, Moon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHIFT_KEYS } from "@/lib/master/rsProfilStore";
import type { ShiftKey, ShiftJam } from "@/lib/master/rsProfilStore";
import type { SectionProps } from "./IdentitasSection";

const base =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 font-mono " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const SHIFT_DISPLAY: Record<ShiftKey, {
  icon: IconComponent;
  bg: string; text: string; border: string; headerBg: string;
}> = {
  Pagi:  {
    icon: Sunrise,
    bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
    headerBg: "bg-amber-100/60",
  },
  Siang: {
    icon: Sun,
    bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200",
    headerBg: "bg-sky-100/60",
  },
  Malam: {
    icon: Moon,
    bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200",
    headerBg: "bg-slate-100/60",
  },
};

function calcDuration(mulai: string, selesai: string): string {
  const [hm, mm] = mulai.split(":").map(Number);
  const [hs, ms] = selesai.split(":").map(Number);
  let mins = (hs * 60 + ms) - (hm * 60 + mm);
  if (mins <= 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
}

export default function ShiftSection({ draft, onPatch }: SectionProps) {
  const patch = (key: ShiftKey, jam: Partial<ShiftJam>) =>
    onPatch({ shift: { ...draft.shift, [key]: { ...draft.shift[key], ...jam } } });

  return (
    <div className="space-y-4 p-5">

      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Jam Kerja per Shift
      </p>

      <div className="space-y-3">
        {SHIFT_KEYS.map((key) => {
          const cfg     = SHIFT_DISPLAY[key];
          const ShiftIcon = cfg.icon;
          const dur     = calcDuration(draft.shift[key].mulai, draft.shift[key].selesai);

          return (
            <div
              key={key}
              className={cn(
                "overflow-hidden rounded-xl border",
                cfg.bg, cfg.border,
              )}
            >
              {/* Shift label row */}
              <div className={cn("flex items-center gap-2.5 px-4 py-2.5", cfg.headerBg)}>
                <ShiftIcon size={15} className={cfg.text} />
                <p className={cn("text-sm font-bold", cfg.text)}>Shift {key}</p>
                <span className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  cfg.bg, cfg.text,
                )}>
                  {dur}
                </span>
              </div>

              {/* Time inputs */}
              <div className="flex items-end gap-6 px-4 py-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Mulai
                  </p>
                  <input
                    type="time"
                    value={draft.shift[key].mulai}
                    onChange={(e) => patch(key, { mulai: e.target.value })}
                    className={cn(base, "w-[120px]")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Selesai
                  </p>
                  <input
                    type="time"
                    value={draft.shift[key].selesai}
                    onChange={(e) => patch(key, { selesai: e.target.value })}
                    className={cn(base, "w-[120px]")}
                  />
                </div>
                <p className="pb-2 text-[11px] text-slate-400">
                  {draft.shift[key].mulai} – {draft.shift[key].selesai}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
        <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
        <p className="text-[11px] text-slate-500">
          Digunakan oleh <strong>MAR</strong>, <strong>Checklist PPI Bundle HAI</strong>, dan{" "}
          <strong>Handover Shift</strong> di seluruh modul. Shift dengan jam melewati tengah malam
          (mis. Malam 22:00–06:59) dihitung otomatis sebagai overnight.
        </p>
      </div>

    </div>
  );
}
