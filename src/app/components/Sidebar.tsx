"use client";

import { useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Stethoscope,
  BedDouble,
  Siren,
  Pill,
  FlaskConical,
  Radiation,
  CreditCard,
  BarChart3,
  X,
  Activity,
} from "lucide-react";
import { useSidebar } from "@/app/contexts/SidebarContext";
import { cn } from "@/app/lib/utils";

// ── Menu groups ───────────────────────────────────────────

const GROUPS = [
  {
    label: "Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Pelayanan",
    items: [
      { label: "Pendaftaran",  href: "/dashboard/pendaftaran", icon: ClipboardList },
      { label: "Rawat Jalan",  href: "/dashboard/rawat-jalan", icon: Stethoscope   },
      { label: "Rawat Inap",   href: "/dashboard/rawat-inap",  icon: BedDouble     },
      { label: "IGD",          href: "/dashboard/igd",          icon: Siren         },
    ],
  },
  {
    label: "Penunjang",
    items: [
      { label: "Farmasi",      href: "/dashboard/farmasi",      icon: Pill          },
      { label: "Laboratorium", href: "/dashboard/laboratorium", icon: FlaskConical  },
      { label: "Radiologi",    href: "/dashboard/radiologi",    icon: Radiation     },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { label: "Billing",  href: "/dashboard/billing", icon: CreditCard },
      { label: "Laporan",  href: "/dashboard/laporan", icon: BarChart3  },
    ],
  },
] as const;

// ── Helpers ───────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

// ── Nav item ──────────────────────────────────────────────

function NavItem({
  label,
  href,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon
        size={16}
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600",
        )}
        aria-hidden="true"
      />
      {label}
    </a>
  );
}

// ── Nav content ───────────────────────────────────────────

function NavContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-4 px-3" aria-label="Menu modul SIMRS">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ label, href, icon }) => (
              <NavItem
                key={href}
                label={label}
                href={href}
                icon={icon}
                active={isActive(pathname, href)}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ── Brand ─────────────────────────────────────────────────

function Brand() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200 px-5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
        <Activity size={14} className="text-white" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-bold leading-none text-slate-900">SIMRS</p>
        <p className="text-[10px] leading-tight text-slate-400">RS Harapan Sehat</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────

interface SidebarProps {
  pathname: string;
}

export default function Sidebar({ pathname }: SidebarProps) {
  const { isOpen, close } = useSidebar();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* ── Desktop ─────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col"
        aria-label="Sidebar navigasi"
      >
        <div className="flex h-full flex-col border-r border-slate-200 bg-white">
          <Brand />
          <div className="flex-1 overflow-y-auto py-4">
            <NavContent pathname={pathname} />
          </div>
          <div className="border-t border-slate-200 px-5 py-3">
            <p className="text-[11px] text-slate-400">SIMRS v2.0 · 2025</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile: backdrop ────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* ── Mobile: drawer ──────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Activity size={14} className="text-white" />
            </span>
            <p className="text-sm font-bold text-slate-900">SIMRS</p>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <NavContent pathname={pathname} onNavigate={close} />
        </div>

        <div className="border-t border-slate-200 px-5 py-3">
          <p className="text-[11px] text-slate-400">SIMRS v2.0 · 2025</p>
        </div>
      </div>
    </>
  );
}
