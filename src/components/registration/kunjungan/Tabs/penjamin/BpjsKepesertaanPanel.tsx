"use client";

// Cek kepesertaan JKN untuk tab "Ubah Penjamin". Kiri: <search><form> (Enter = cari, native) dengan
// mode No. Kartu / NIK (radio), label terlihat, penghitung digit + bilah progres. Validasi saat submit:
// kurang digit → pesan + fokus kembali ke input (tombol tak di-disable kecuali saat mencari). Kanan:
// placeholder → skeleton → kartu peserta. Hasil diumumkan lewat role="status".
// Hasil (BpjsData) dipegang induk → tetap ada saat operator berpindah jenis lalu kembali.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { motion } from "framer-motion";
import { CreditCard, Fingerprint, FlaskConical, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import type { BpjsData, BpjsMode } from "../sep/sepTypes";
import { cariKepesertaanJkn } from "../sep/kepesertaanJknMock";
import { BpjsMemberCard } from "./BpjsMemberCard";
import { digitsOnly, isFullNoKartu } from "./penjaminConfig";
import { INPUT } from "./penjaminUi";

const MODES: { id: BpjsMode; label: string; icon: typeof CreditCard; len: number; field: string }[] = [
  { id: "kartu", label: "No. Kartu", icon: CreditCard, len: 13, field: "No. kartu BPJS" },
  { id: "nik", label: "NIK", icon: Fingerprint, len: 16, field: "NIK peserta" },
];

export function BpjsKepesertaanPanel({
  defaultNoKartu, patientName, savedNoKartu, result, onResult, inputRef, nudge, onNudgeClear, disabled,
}: {
  /** Nilai awal pencarian (No. kartu tersimpan) — induk me-remount panel bila nilai penuh tiba. */
  defaultNoKartu: string;
  patientName: string;
  savedNoKartu: string;
  result: BpjsData | null;
  onResult: (r: BpjsData | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Induk meminta "cek kepesertaan dulu" (operator menekan Terbitkan SEP sebelum mencari). */
  nudge: boolean;
  onNudgeClear: () => void;
  disabled?: boolean;
}) {
  const uid = useId();
  const [mode, setMode] = useState<BpjsMode>("kartu");
  // Nomor tersimpan bisa termasker (mis. 0001****7890) → hanya nomor utuh yang diisikan.
  const prefill = isFullNoKartu(defaultNoKartu) ? digitsOnly(defaultNoKartu) : "";
  const [query, setQuery] = useState(prefill);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const m = MODES.find((x) => x.id === mode)!;
  const digitLen = query.length;
  const complete = digitLen === m.len;
  const fromSaved = mode === "kartu" && !!prefill && query === prefill;
  const inputId = `${uid}-q`;
  const hintId = `${uid}-hint`;
  const errId = `${uid}-err`;
  const message = error ?? (nudge ? "Cek kepesertaan dulu sebelum menerbitkan SEP." : null);

  const changeMode = (next: BpjsMode) => {
    setMode(next);
    setQuery("");
    setError(null);
    onResult(null);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searching) return;
    if (!complete) {
      setError(`${m.field} harus ${m.len} digit — baru ${digitLen}.`);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onNudgeClear();
    setSearching(true);
    setAnnounce("");
    onResult(null);
    try {
      const data = await cariKepesertaanJkn({ mode, value: query, nama: patientName });
      onResult(data);
      setAnnounce(`Peserta ditemukan: ${data.nama}, status ${data.status}, hak ${data.kelas}.`);
    } catch {
      setError("Cek kepesertaan gagal — periksa koneksi lalu coba lagi.");
      inputRef.current?.focus();
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ── Pencarian ── */}
      <search className="min-w-0">
        <form
          noValidate
          onSubmit={submit}
          aria-label="Cek kepesertaan JKN"
          className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <fieldset disabled={disabled || searching} className="min-w-0">
            <legend className="mb-1.5 m-xs font-medium text-slate-700">Cari berdasarkan</legend>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {MODES.map((x) => {
                const on = mode === x.id;
                const Icon = x.icon;
                return (
                  <label
                    key={x.id}
                    className={cn(
                      "relative flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg m-xs font-semibold transition-colors",
                      "has-focus-visible:ring-2 has-focus-visible:ring-sky-600",
                      on ? "text-sky-900" : "text-slate-600 hover:text-slate-900",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${uid}-mode`}
                      value={x.id}
                      checked={on}
                      onChange={() => changeMode(x.id)}
                      className="sr-only"
                    />
                    {on && (
                      <motion.span
                        layoutId={`${uid}-pill`}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5"
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <Icon className="size-3.5" aria-hidden="true" />
                      {x.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="m-xs font-medium text-slate-700">{m.field}</label>
            <div className="relative">
              <input
                ref={inputRef}
                id={inputId}
                name={mode === "kartu" ? "noKartu" : "nik"}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                maxLength={m.len}
                value={query}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={message ? `${hintId} ${errId}` : hintId}
                onChange={(e) => {
                  setQuery(digitsOnly(e.target.value).slice(0, m.len));
                  if (error) setError(null);
                  if (result) onResult(null);
                }}
                className={cn(INPUT, "pr-16 font-mono tracking-[0.14em] tabular-nums")}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 m-tiny font-semibold tabular-nums",
                  complete ? "text-emerald-700" : "text-slate-400",
                )}
              >
                {digitLen}/{m.len}
              </span>
            </div>
            <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full transition-[width,background-color] duration-200", complete ? "bg-emerald-500" : "bg-sky-500")}
                style={{ width: `${(digitLen / m.len) * 100}%` }}
              />
            </div>
            <p id={hintId} className="m-tiny text-slate-500">
              {m.len} digit angka{fromSaved && " · terisi dari jaminan tersimpan pasien"}
            </p>
            {message && (
              <p id={errId} className={cn("m-xs font-medium", error ? "text-rose-700" : "text-amber-800")}>
                {message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={disabled || searching}
            className="h-10 w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500/40"
          >
            {searching ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
            {searching ? "Mencari…" : "Cek kepesertaan"}
          </Button>

          <p className="flex items-start gap-1.5 m-tiny leading-snug text-slate-500">
            <FlaskConical className="mt-px size-3 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              <b className="font-semibold text-amber-800">Mode demo</b> — kepesertaan JKN masih tiruan: nomor apa pun dianggap
              aktif sampai terhubung V-Claim.
            </span>
          </p>
        </form>
      </search>

      {/* ── Hasil ── */}
      <div className="min-w-0">
        <p role="status" className="sr-only">{announce}</p>
        {searching ? (
          <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-3 bg-slate-200/70 px-4 pt-4 pb-5 motion-safe:animate-pulse">
              <div className="h-2.5 w-24 rounded bg-white/70" />
              <div className="h-4 w-2/3 rounded bg-white/70" />
              <div className="h-3 w-1/2 rounded bg-white/70" />
            </div>
            <div className="grid grid-cols-3 gap-3 p-4 motion-safe:animate-pulse">
              {[0, 1, 2].map((i) => <div key={i} className="h-8 rounded-lg bg-slate-100" />)}
            </div>
          </div>
        ) : result ? (
          <BpjsMemberCard data={result} patientName={patientName} savedNoKartu={savedNoKartu} />
        ) : (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="m-sm font-semibold text-slate-800">Hasil cek kepesertaan tampil di sini</p>
              <p className="mt-1 m-xs text-slate-500">Status peserta, hak kelas, dan FKTP diperiksa sebelum SEP diterbitkan.</p>
            </div>
            <ol className="flex flex-wrap items-center justify-center gap-1.5 m-tiny text-slate-600">
              {["Isi nomor", "Cek kepesertaan", "Terbitkan SEP"].map((s, i) => (
                <li key={s} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true" className="h-px w-3 bg-slate-300" />}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                    <span className="tabular-nums text-slate-400">{i + 1}.</span> {s}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
