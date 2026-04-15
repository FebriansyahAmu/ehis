"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/app/contexts/SidebarContext";
import { cn } from "@/app/lib/utils";

const NOTIFS = [
  { msg: "Hasil lab pasien Joko Prasetyo tersedia", t: "5 menit lalu"  },
  { msg: "Ada 3 pasien menunggu di IGD",            t: "12 menit lalu" },
  { msg: "Stok obat amoxicillin hampir habis",      t: "1 jam lalu"    },
];

export default function Navbar() {
  const { toggle } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className="relative z-30 grid h-14 shrink-0 grid-cols-[1fr_minmax(0,480px)_1fr] items-center gap-4 border-b border-slate-200 bg-white px-5"
      role="banner"
    >
      {/* Left — hamburger (mobile only) */}
      <div className="flex items-center">
        <button
          onClick={toggle}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          aria-label="Buka menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Center — search */}
      <div className="flex justify-center">
        <label htmlFor="global-search" className="sr-only">
          Cari pasien, dokter, modul…
        </label>
        <div className="relative w-full max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="global-search"
            type="search"
            placeholder="Cari pasien, dokter, modul…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Right — bell + avatar */}
      <div className="flex items-center justify-end gap-1">
        {/* Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Notifikasi"
            aria-expanded={notifOpen}
          >
            <Bell size={17} />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500"
              aria-hidden="true"
            />
          </button>

          {notifOpen && (
            <div className="animate-fade-in absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Notifikasi
              </p>
              {NOTIFS.map((n, i) => (
                <button
                  key={i}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{n.msg}</p>
                    <p className="text-xs text-slate-400">{n.t}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

        {/* Avatar */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
            aria-label="Menu pengguna"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              DR
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              dr. Rizky
            </span>
            <ChevronDown
              size={13}
              className={cn(
                "text-slate-400 transition-transform duration-200",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="animate-fade-in absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
            >
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-800">dr. Rizky Pratama</p>
                <p className="text-xs text-slate-400">Admin · SIMRS</p>
              </div>
              <hr className="border-slate-100" />
              {[
                { icon: User,     label: "Profil Saya" },
                { icon: Settings, label: "Pengaturan"  },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <Icon size={14} className="text-slate-400" />
                  {label}
                </button>
              ))}
              <hr className="border-slate-100" />
              <button
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
