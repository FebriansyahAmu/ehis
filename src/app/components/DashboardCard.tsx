import { TrendingUp, TrendingDown } from "lucide-react";
import type { StatCard } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

const COLOR_MAP = {
  indigo:  { icon: "bg-indigo-100 text-indigo-600",  value: "text-indigo-700"  },
  sky:     { icon: "bg-sky-100 text-sky-600",         value: "text-sky-700"     },
  emerald: { icon: "bg-emerald-100 text-emerald-600", value: "text-emerald-700" },
  rose:    { icon: "bg-rose-100 text-rose-600",       value: "text-rose-700"    },
} as const;

interface DashboardCardProps extends StatCard {
  icon: React.ReactNode;
  index?: number;
}

export default function DashboardCard({
  label,
  value,
  unit,
  trend,
  color,
  icon,
  index = 0,
}: DashboardCardProps) {
  const c = COLOR_MAP[color];
  const isPositive = trend >= 0;

  return (
    <article
      className="animate-fade-in rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`${label}: ${value} ${unit}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", c.icon)}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
          )}
        >
          {isPositive
            ? <TrendingUp size={11} aria-hidden="true" />
            : <TrendingDown size={11} aria-hidden="true" />
          }
          {Math.abs(trend)}%
        </span>
      </div>

      <p className={cn("mt-4 text-3xl font-bold tabular-nums", c.value)}>
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
      <p className="text-xs text-slate-400">vs kemarin</p>
    </article>
  );
}
