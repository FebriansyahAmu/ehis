// Kartu layanan Beranda EHIS Care — 1 tujuan per kartu dengan pola "stretched link":
// hanya judul yang jadi <a> (nama aksesibel pendek: "IGD"), ::after-nya membentang menutup kartu
// sehingga seluruh kartu tetap bisa diklik. Hover & cincin fokus digambar di kartu lewat :has().

import Link from "next/link";
import { AlertCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Card } from "@/components/ui/card";
import type { ServiceDef } from "./careBerandaData";

const fmt = (v: number | string) => (typeof v === "number" ? v.toLocaleString("id-ID") : v);

interface Props {
  svc: ServiceDef;
  /** Jeda animasi masuk (stagger), hanya bila pengguna tidak meminta gerak dikurangi. */
  delayMs?: number;
}

export default function CareServiceCard({ svc, delayMs }: Props) {
  const Icon = svc.icon;
  return (
    <Card
      className={cn(
        "group relative h-full gap-0 py-0 transition-[border-color,box-shadow,translate] duration-200 ease-out",
        "has-[a:hover]:shadow-md motion-safe:has-[a:hover]:-translate-y-px",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-offset-2",
        "motion-safe:animate-[fade-in_0.35s_ease_both]",
        svc.tone.hover,
        svc.tone.focus,
      )}
      style={delayMs != null ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        <span
          className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", svc.tone.tile)}
          aria-hidden="true"
        >
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-base font-semibold leading-snug text-slate-900">
            <Link href={svc.href} className="outline-none after:absolute after:inset-0 after:rounded-xl">
              {svc.label}
            </Link>
          </h3>
          <p className="m-xs truncate text-slate-500">{svc.desc}</p>
        </div>
        <ArrowUpRight
          className={cn(
            "size-4 shrink-0 text-slate-400 transition duration-200 ease-out",
            "group-has-[a:hover]:text-slate-700 motion-safe:group-has-[a:hover]:translate-x-0.5 motion-safe:group-has-[a:hover]:-translate-y-0.5",
          )}
          aria-hidden="true"
        />
      </div>

      <ul role="list" className="mt-auto grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        {svc.stats.map((s) => (
          <li key={s.label} className="min-w-0 px-3 py-2.5 first:pl-4 last:pr-4">
            <p
              className={cn(
                "flex items-center gap-1 font-semibold tabular-nums leading-tight",
                s.alert ? "text-rose-600" : "text-slate-900",
              )}
            >
              {s.alert && <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />}
              <span className="m-base">{fmt(s.value)}</span>
              {s.of != null && <span className="m-xs font-medium text-slate-500">/{fmt(s.of)}</span>}
            </p>
            <p className="m-tiny truncate text-slate-500">
              {s.label}
              {s.alert && <span className="sr-only"> (perlu perhatian)</span>}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
