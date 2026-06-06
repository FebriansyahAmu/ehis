"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Clock,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

const OVERVIEW = [
  { icon: Stethoscope, label: "Rekam medis terintegrasi" },
  { icon: ShieldCheck, label: "Data terenkripsi & teraudit" },
  { icon: Clock, label: "Real-time di semua unit" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setError(null);
    setSubmitting(true);
    try {
      await apiLogin(username, password);
      // Honor ?next= (dari proxy) bila path internal aman; selain itu ke dashboard.
      const next = new URLSearchParams(window.location.search).get("next");
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/ehis-dashboard";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      {/* ── Ambient background ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, #ccfbf1 0%, transparent 60%), radial-gradient(50% 50% at 100% 100%, #e0f2fe 0%, transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(70% 70% at 50% 40%, #000 0%, transparent 75%)",
        }}
      />

      {/* ── Card ───────────────────────────────────────────── */}
      <div className="animate-fade-in relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:p-10">
          {/* Logo + brand */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-teal-900/10">
              <Activity size={26} className="text-teal-300" />
            </div>
            <h1 className="font-(family-name:--font-poppins) mt-5 text-2xl font-semibold tracking-tight text-slate-900">
              Masuk ke EHIS
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sistem Informasi RS Harapan Sehat
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={error ? "mt-4 space-y-5" : "mt-8 space-y-5"}>
            {/* Username */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="group relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600"
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="nama.pengguna"
                  autoComplete="username"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-teal-600 transition hover:text-teal-700"
                >
                  Lupa password?
                </button>
              </div>
              <div className="group relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-teal-600 accent-teal-600 focus:ring-2 focus:ring-teal-500/20"
              />
              Biarkan saya tetap masuk
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-200 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-600/20 focus:outline-none focus:ring-4 focus:ring-teal-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Overview */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {OVERVIEW.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon size={13} className="text-teal-600" />
              {label}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} className="text-slate-400" />
          <p className="text-[11px] tracking-wide text-slate-400">
            Koneksi aman &middot; EHIS v2.0 &middot; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
