// Strip KPI Beranda EHIS Care — 1 Card, sel dipisah garis 1px (gap-px di atas latar border),
// 2 kolom di ponsel → 4 kolom di layar lebar. Label di atas nilai (urutan baca = urutan visual).

import { cn } from "@/lib/ui/utils";
import { Card } from "@/components/ui/card";
import type { KpiDef } from "./careBerandaData";

const fmt = (v: number | string) => (typeof v === "number" ? v.toLocaleString("id-ID") : v);

export default function CareKpiStrip({ items }: { items: readonly KpiDef[] }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <ul role="list" className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {items.map(({ label, value, of, icon: Icon, tile, bar }) => {
          const pct = of && typeof value === "number" ? Math.round((value / of) * 100) : null;
          return (
            <li key={label} className="flex items-center gap-3 bg-card px-4 py-3">
              <span
                className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tile)}
                aria-hidden="true"
              >
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-tiny truncate font-medium text-slate-500">{label}</p>
                <p className="flex items-baseline gap-0.5 font-semibold tabular-nums text-slate-900">
                  <span className="text-lg leading-tight">{fmt(value)}</span>
                  {of != null && <span className="m-xs font-medium text-slate-500">/{fmt(of)}</span>}
                </p>
                {pct != null && bar && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
