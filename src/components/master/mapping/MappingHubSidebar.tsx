"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBPAGE_REGISTRY, type SubpageKey, type SubpageConfig } from "./mappingShared";

interface MappingHubSidebarProps {
  activeKey: SubpageKey;
  onSelect: (key: SubpageKey) => void;
}

export default function MappingHubSidebar({ activeKey, onSelect }: MappingHubSidebarProps) {
  const ready = SUBPAGE_REGISTRY.filter((s) => s.status === "ready");
  const soon = SUBPAGE_REGISTRY.filter((s) => s.status === "soon");

  return (
    <>
      {/* Mobile / Tablet (< lg): tab strip horizontal scrollable — kompak, tinggi kecil, agar
          kolom konten (matrix/mapping) dapat tinggi. Vertikal `h-full` sidebar di flex-col mobile
          akan melahap seluruh tinggi → konten 0 (itu kenapa matrix "hilang" di layar kecil). */}
      <nav
        aria-label="Navigasi Mapping Hub"
        className="flex shrink-0 gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm lg:hidden [scrollbar-width:thin]"
      >
        {SUBPAGE_REGISTRY.map((sp) => (
          <TabChip
            key={sp.key}
            config={sp}
            active={activeKey === sp.key}
            onClick={() => onSelect(sp.key)}
          />
        ))}
      </nav>

      {/* Desktop (lg+): sidebar vertikal penuh */}
      <aside className="hidden h-full w-full shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex lg:w-65">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="m-sm font-bold text-slate-800">Mapping Hub</p>
          <p className="m-tiny text-slate-400">
            {ready.length} aktif · {soon.length} segera
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2.5">
          <Section label="Aktif">
            {ready.map((sp) => (
              <SidebarItem
                key={sp.key}
                config={sp}
                active={activeKey === sp.key}
                onClick={() => onSelect(sp.key)}
              />
            ))}
          </Section>

          {soon.length > 0 && (
            <Section label="Segera Hadir" className="mt-3">
              {soon.map((sp) => (
                <SidebarItem
                  key={sp.key}
                  config={sp}
                  active={activeKey === sp.key}
                  onClick={() => onSelect(sp.key)}
                />
              ))}
            </Section>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-2.5">
          <p className="m-mini leading-relaxed text-slate-400">
            Mapping = relasi antar entitas master. Source of truth tunggal di sini.
          </p>
        </div>
      </aside>
    </>
  );
}

// ── Mobile tab chip ──────────────────────────────────────
function TabChip({
  config, active, onClick,
}: {
  config: SubpageConfig;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  const ready = config.status === "ready";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 m-xs font-semibold transition",
        active
          ? cn(config.accent.bg, config.accent.text, "ring-1", config.accent.ring)
          : "text-slate-600 hover:bg-slate-50",
        !ready && !active && "text-slate-400",
      )}
    >
      <Icon size={13} className="shrink-0" />
      <span className="whitespace-nowrap">{config.label}</span>
      {!ready && <Clock size={9} className="shrink-0 opacity-60" />}
    </button>
  );
}

// ── Sub-components ───────────────────────────────────────

function Section({
  label, children, className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 px-2.5 m-mini font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  config, active, onClick,
}: {
  config: SubpageConfig;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  const ready = config.status === "ready";
  const StatusIcon = ready ? CheckCircle2 : Clock;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-all",
        active
          ? cn(config.accent.bg, config.accent.text, "ring-1", config.accent.ring)
          : "text-slate-600 hover:bg-slate-50",
        !ready && !active && "opacity-70",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
          active
            ? "bg-white/60"
            : ready
              ? cn(config.accent.bg, config.accent.text)
              : "bg-slate-100 text-slate-400",
        )}
      >
        <Icon size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <p className={cn("truncate m-xs font-semibold", active && "font-bold")}>
            {config.label}
          </p>
          <StatusIcon
            size={9}
            className={cn(
              "shrink-0",
              ready ? "text-emerald-500" : active ? "opacity-70" : "text-slate-400",
            )}
          />
        </div>
        <p className={cn(
          "mt-0.5 truncate m-mini leading-tight",
          active ? "opacity-80" : "text-slate-400",
        )}>
          {config.desc}
        </p>
        {!ready && config.dependsOn && (
          <p className={cn(
            "mt-0.5 truncate m-mini font-medium",
            active ? "opacity-70" : "text-slate-400",
          )}>
            Butuh: {config.dependsOn}
          </p>
        )}
      </div>
    </motion.button>
  );
}
