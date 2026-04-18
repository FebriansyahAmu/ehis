import Link from "next/link";
import type { Metadata } from "next";
import { Activity } from "lucide-react";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Brand panel (desktop) ─────────────────────────── */}
      <div className="relative hidden w-[45%] overflow-hidden bg-[#0a0f1e] lg:flex lg:flex-col lg:justify-between">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute -top-1/4 left-1/2 h-150 w-150 -translate-x-1/2 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
        />

        {/* Dot grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Diagonal accent line */}
        <div
          className="pointer-events-none absolute -right-20 top-1/3 h-px w-[140%] rotate-25 opacity-[0.08]"
          style={{ background: "linear-gradient(90deg, transparent, #38bdf8 40%, #38bdf8 60%, transparent)" }}
        />

        {/* Brand content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
          <div className="animate-fade-in">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 ring-1 ring-sky-400/20">
              <Activity size={22} className="text-sky-400" />
            </div>
            <h1 className="font-(family-name:--font-display) text-4xl tracking-tight text-white xl:text-5xl">
              EHIS
            </h1>
            <p className="mt-2 text-lg font-light tracking-wide text-slate-400">
              Sistem Informasi
              <br />
              Rumah Sakit
            </p>
          </div>

          <div className="animate-fade-in mt-16" style={{ animationDelay: "200ms" }}>
            <div className="h-px w-12 bg-sky-500/30" />
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Platform terintegrasi untuk manajemen
              <br />
              pelayanan kesehatan yang optimal.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-12 pb-8 xl:px-16">
          <p className="animate-fade-in text-[11px] tracking-widest text-slate-600" style={{ animationDelay: "400ms" }}>
            RS HARAPAN SEHAT
          </p>
        </div>
      </div>

      {/* ── Form panel ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center bg-white px-6 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile brand (hidden on desktop) */}
          <div className="animate-fade-in mb-10 lg:hidden">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0f1e]">
              <Activity size={18} className="text-sky-400" />
            </div>
            <h1 className="font-(family-name:--font-display) text-3xl tracking-tight text-slate-900">
              EHIS
            </h1>
            <p className="mt-1 text-sm text-slate-400">Sistem Informasi Rumah Sakit</p>
          </div>

          {/* Heading */}
          <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Masuk ke akun Anda
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Silakan masukkan kredensial untuk melanjutkan.
            </p>
          </div>

          {/* Form */}
          <form
            className="animate-fade-in mt-8 space-y-5"
            style={{ animationDelay: "200ms" }}
            action="/ehis-dashboard"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="nama@rumahsakit.id"
                autoComplete="email"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-sky-500 transition hover:text-sky-600"
                >
                  Lupa password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <Link
              href="/ehis-dashboard"
              className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-lg bg-[#0a0f1e] text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 active:scale-[0.98]"
            >
              <span className="relative z-10">Masuk</span>
              <div className="absolute inset-0 bg-sky-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          </form>

          {/* Footer */}
          <p
            className="animate-fade-in mt-10 text-center text-[11px] tracking-wide text-slate-300"
            style={{ animationDelay: "400ms" }}
          >
            EHIS v2.0 &middot; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
