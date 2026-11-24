"use client";

// Form CPPT (tambah / edit). Pola:
// - Jenis catatan & metode TBAK = radio native; langkah TBAK = checkbox native; label terlihat.
// - Bagian naratif = AutoTextarea (tinggi mengikuti isi) dalam kotak yang menyala saat fokus.
// - Validasi saat Simpan (tombol tak pernah di-disable kecuali sedang menyimpan): pesan per field +
//   fokus ke field pertama yang bermasalah; pesan hilang sendiri begitu diperbaiki.
// - Ctrl/⌘ + Enter = simpan (requestSubmit → jalur submit yang sama dgn tombol).
// - Footer simpan lengket di bawah area gulir → tombol tetap terlihat saat menulis catatan panjang.

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Activity, AlertCircle, Check, CheckCircle2, ChevronDown, Eraser, LayoutTemplate, Loader2, Phone, Save, User, X,
} from "lucide-react";
import type { CPPTEntry, CPPTProfesi } from "@/lib/data";
import { cn } from "@/lib/ui/utils";
import { Select } from "@/components/shared/inputs";
import { listObservasi } from "@/lib/api/observation";
import {
  CPPT_JENIS_LIST, CPPT_JENIS_META, PROFESI_CLS, PROFESI_LIST, TBAK_METODE_LIST, TBAK_STEPS,
  areasFor, dayLabel, fmtDate, todayISO, type CPPTAreaDef, type CPPTFieldKey,
} from "../cpptShared";
import { AutoTextarea } from "./AutoTextarea";
import {
  CPPT_TEMPLATES, applyTemplate, narasiKeys, validateForm, type CPPTForm, type CpptErrorKey, type CpptErrors,
} from "./cpptForm";
import { latestObservation, ttvSnippet } from "./ttvSnippet";

const MIN_H: Record<number, string> = {
  2: "min-h-[calc(2lh+1.25rem)]",
  3: "min-h-[calc(3lh+1.25rem)]",
};

const ERROR_ORDER: CpptErrorKey[] = ["penulis", "narasi", "tbakPemberi", "instruksi", "tbakSteps"];

const INPUT = cn(
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 transition sm:text-sm",
  "placeholder:text-slate-400 hover:border-slate-400",
  "focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/15",
  "aria-invalid:border-rose-500",
);

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 flex items-center gap-1 m-xs font-medium text-rose-700">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function NarasiField({
  area, value, onChange, invalid, errorId, fieldRef, action,
}: {
  area: CPPTAreaDef;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  errorId?: string;
  fieldRef?: (el: HTMLTextAreaElement | null) => void;
  action?: ReactNode;
}) {
  const id = useId();
  const filled = !!value.trim();
  return (
    <div
      className={cn(
        "rounded-xl border transition-[border-color,background-color,box-shadow]",
        "focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-indigo-500/10",
        invalid ? "border-rose-300 bg-rose-50/30" : filled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 pt-2.5">
        <span aria-hidden="true" className={cn("flex size-5 items-center justify-center rounded-md text-[11px] font-bold", area.badgeCls)}>
          {area.badge}
        </span>
        <label htmlFor={id} className="m-xs font-semibold text-slate-700">{area.label}</label>
        {filled && <CheckCircle2 role="img" className="size-3.5 text-emerald-600" aria-label="terisi" />}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      <AutoTextarea
        ref={fieldRef}
        id={id}
        name={area.key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={area.placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && errorId ? errorId : undefined}
        className={cn(
          "block max-h-[min(24rem,50dvh)] bg-transparent px-3 pt-1.5 pb-2.5 text-base leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm",
          MIN_H[area.rows ?? 2],
        )}
      />
    </div>
  );
}

export interface CpptComposerProps {
  form: CPPTForm;
  onChange: (patch: Partial<CPPTForm>) => void;
  /** Entri yang sedang diedit (null = catatan baru). */
  editing: CPPTEntry | null;
  isPersisted: boolean;
  /** Nama user login (mode DB: penulis ditetapkan server). */
  penulisLogin: string | null;
  needsVerify: boolean;
  saving: boolean;
  /** Kunjungan DB → tombol "Sisipkan TTV terakhir" aktif. */
  ttvKunjunganId: string | null;
  draftRestored: boolean;
  onDiscardDraft: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onClear: () => void;
  /** Naik saat Edit/Salin diklik → gulir ke form & fokus bagian pertama. */
  focusKey: number;
}

export function CpptComposer({
  form, onChange, editing, isPersisted, penulisLogin, needsVerify, saving, ttvKunjunganId,
  draftRestored, onDiscardDraft, onSave, onCancelEdit, onClear, focusKey,
}: CpptComposerProps) {
  const uid = useId();
  const reduce = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const fields = useRef<Partial<Record<CpptErrorKey | CPPTFieldKey, HTMLElement | null>>>({});
  const [attempted, setAttempted] = useState(false);
  const [showTpl, setShowTpl] = useState(false);
  const [note, setNote] = useState("");
  const [ttvBusy, setTtvBusy] = useState(false);

  // Galat dihitung ulang dari nilai terkini sesudah percobaan simpan pertama → hilang sendiri saat diperbaiki.
  const errors: CpptErrors = attempted ? validateForm(form, !isPersisted) : {};
  const errId = (k: CpptErrorKey) => `${uid}-err-${k}`;
  const isTbak = form.jenis === "TBAK";
  const areas = areasFor(form.jenis);
  const keys = narasiKeys(form.jenis);
  const filledCount = isTbak
    ? TBAK_STEPS.filter((s) => form[s.key]).length
    : keys.filter((k) => form[k].trim()).length;
  const totalCount = isTbak ? TBAK_STEPS.length : keys.length;

  // Edit / Salin → bawa form ke tampilan & fokus bagian pertama.
  useEffect(() => {
    if (!focusKey) return;
    formRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    const first = form.jenis === "TBAK" ? fields.current.tbakPemberi : fields.current[narasiKeys(form.jenis)[0]];
    first?.focus({ preventScroll: true });
    // Hanya dipicu focusKey (aksi operator), bukan tiap perubahan isi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const errs = validateForm(form, !isPersisted);
    const first = ERROR_ORDER.find((k) => errs[k]);
    if (first) {
      setAttempted(true);
      const target = first === "narasi" ? fields.current[keys[0]] : fields.current[first];
      target?.focus();
      return;
    }
    setAttempted(false);
    setShowTpl(false);
    onSave();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const pickTemplate = (id: string) => {
    const t = CPPT_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    const { form: next, filled } = applyTemplate(form, t);
    onChange(next);
    setShowTpl(false);
    setNote(filled ? `Templat "${t.label}" mengisi ${filled} bagian yang masih kosong.` : `Semua bagian sudah terisi — templat "${t.label}" tidak menimpa isi.`);
    requestAnimationFrame(() => fields.current[narasiKeys(t.jenis)[0]]?.focus());
  };

  const insertTtv = async () => {
    if (!ttvKunjunganId || ttvBusy) return;
    setTtvBusy(true);
    setNote("");
    try {
      const last = latestObservation(await listObservasi(ttvKunjunganId));
      if (!last) {
        setNote("Belum ada TTV tercatat untuk kunjungan ini.");
        return;
      }
      const snippet = ttvSnippet(last);
      onChange({ objektif: form.objektif.trim() ? `${form.objektif.trimEnd()}\n${snippet}` : snippet });
      setNote(`TTV ${last.jam} disisipkan ke bagian ${form.jenis === "SBAR" ? "Background" : "Objektif"}.`);
      fields.current.objektif?.focus();
    } catch {
      setNote("TTV tidak dapat dimuat — periksa akses atau koneksi.");
    } finally {
      setTtvBusy(false);
    }
  };

  const jenisMeta = CPPT_JENIS_META[form.jenis];

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={submit}
      onKeyDown={onKeyDown}
      aria-labelledby={`${uid}-title`}
      className={cn(
        "relative rounded-2xl border bg-white shadow-sm transition-[border-color,box-shadow]",
        editing ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200",
      )}
    >
      {/* ── Kepala ── */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-t-2xl border-b px-4 py-3 sm:px-5",
          editing ? "border-amber-200 bg-amber-50/70" : "border-slate-100 bg-slate-50/70",
        )}
      >
        <div className="min-w-0 flex-1">
          <h2 id={`${uid}-title`} className={cn("m-sm font-semibold", editing ? "text-amber-900" : "text-slate-900")}>
            {editing ? "Edit catatan CPPT" : "Catatan CPPT baru"}
          </h2>
          <p className="truncate m-tiny text-slate-500">
            {editing
              ? `${editing.tanggal ? `${dayLabel(editing.tanggal)}, ` : ""}${editing.waktu} · ${editing.profesi} · ${editing.penulis}`
              : `${fmtDate(todayISO())} · ${isPersisted ? "waktu dicatat otomatis saat disimpan" : "mode demo (tidak tersimpan)"}`}
          </p>
        </div>
        {draftRestored && !editing && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 py-0.5 pr-1 pl-2.5 m-tiny font-semibold text-amber-900 ring-1 ring-amber-300">
            Draf dipulihkan
            <button
              type="button"
              onClick={onDiscardDraft}
              className="rounded-full px-1.5 py-0.5 font-semibold text-amber-800 underline-offset-2 hover:bg-amber-200 hover:underline focus-visible:outline-2 focus-visible:outline-amber-600"
            >
              Buang
            </button>
          </span>
        )}
        {!isTbak && (
          <button
            type="button"
            onClick={() => setShowTpl((v) => !v)}
            aria-expanded={showTpl}
            aria-controls={`${uid}-tpl`}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 m-xs font-medium transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
              showTpl ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700",
            )}
          >
            <LayoutTemplate className="size-3.5" aria-hidden="true" />
            Templat
            <ChevronDown className={cn("size-3.5 transition-transform", showTpl && "rotate-180")} aria-hidden="true" />
          </button>
        )}
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 m-xs font-medium text-amber-800 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-600"
          >
            <X className="size-3.5" aria-hidden="true" /> Batal edit
          </button>
        )}
      </div>

      {/* ── Templat ── */}
      <div id={`${uid}-tpl`} hidden={!showTpl || isTbak} className="border-b border-indigo-100 bg-indigo-50/40 px-4 py-3 sm:px-5">
        <p className="mb-2 m-tiny text-indigo-900/80">Templat mengisi bagian yang masih kosong — tulisan Anda tidak ditimpa.</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {CPPT_TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => pickTemplate(t.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 m-mini font-bold", CPPT_JENIS_META[t.jenis].chip)}>{t.jenis}</span>
                <span className="min-w-0 flex-1 truncate m-xs font-medium text-slate-800">{t.label}</span>
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 m-mini font-semibold", PROFESI_CLS[t.profesi])}>{t.profesi}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Isi ── */}
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            {isPersisted ? (
              <>
                <p className="mb-1.5 m-xs font-medium text-slate-700">Dicatat oleh</p>
                <p className="flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm text-slate-700">
                  <User className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <span className="truncate">{penulisLogin || "Akun Anda (otomatis)"}</span>
                </p>
              </>
            ) : (
              <>
                <label htmlFor={`${uid}-penulis`} className="mb-1.5 block m-xs font-medium text-slate-700">
                  Nama penulis <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  ref={(el) => { fields.current.penulis = el; }}
                  id={`${uid}-penulis`}
                  name="penulis"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.penulis}
                  onChange={(e) => onChange({ penulis: e.target.value })}
                  aria-invalid={!!errors.penulis || undefined}
                  aria-describedby={errors.penulis ? errId("penulis") : undefined}
                  className={INPUT}
                />
                <FieldError id={errId("penulis")}>{errors.penulis}</FieldError>
              </>
            )}
          </div>
          <div className="min-w-0">
            <label htmlFor={`${uid}-profesi`} className="mb-1.5 block m-xs font-medium text-slate-700">Profesi</label>
            <Select
              id={`${uid}-profesi`}
              value={form.profesi}
              onChange={(v) => onChange({ profesi: v as CPPTProfesi })}
              options={PROFESI_LIST}
            />
          </div>
        </div>

        <fieldset className="min-w-0">
          <legend className="mb-1.5 m-xs font-medium text-slate-700">Jenis catatan</legend>
          <div className="grid grid-cols-3 gap-2">
            {CPPT_JENIS_LIST.map((j) => {
              const m = CPPT_JENIS_META[j];
              const on = form.jenis === j;
              return (
                <label
                  key={j}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-0.5 rounded-xl border-2 px-3 py-2 transition-[border-color,background-color]",
                    "has-focus-visible:ring-2 has-focus-visible:ring-indigo-600 has-focus-visible:ring-offset-1",
                    on ? m.active : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  )}
                >
                  <input
                    type="radio"
                    name={`${uid}-jenis`}
                    value={j}
                    checked={on}
                    onChange={() => { onChange({ jenis: j }); setNote(""); }}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className={cn("size-2 rounded-full", on ? m.dot : "bg-slate-300")} />
                    <span className="m-sm font-bold">{m.label}</span>
                  </span>
                  <span className={cn("m-tiny leading-tight", on ? "opacity-90" : "text-slate-500")}>{m.ket}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {!isTbak ? (
          <div className="flex flex-col gap-2.5">
            {errors.narasi && <FieldError id={errId("narasi")}>{errors.narasi}</FieldError>}
            {areas.map((a) => (
              <NarasiField
                key={a.key}
                area={a}
                value={form[a.key]}
                onChange={(v) => onChange({ [a.key]: v } as Partial<CPPTForm>)}
                invalid={!!errors.narasi}
                errorId={errId("narasi")}
                fieldRef={(el) => { fields.current[a.key] = el; }}
                action={a.key === "objektif" && ttvKunjunganId ? (
                  <button
                    type="button"
                    onClick={() => void insertTtv()}
                    disabled={ttvBusy}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 m-tiny font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-60"
                  >
                    {ttvBusy ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <Activity className="size-3" aria-hidden="true" />}
                    Sisipkan TTV terakhir
                  </button>
                ) : null}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 m-xs leading-relaxed text-rose-900 ring-1 ring-inset ring-rose-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
              <span>
                Instruksi verbal / via telepon — wajib <b className="font-semibold">Tulis–Baca–Konfirmasi</b> (SKP 2) dan
                diverifikasi DPJP dalam 1×24 jam.
              </span>
            </p>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <label htmlFor={`${uid}-pemberi`} className="mb-1.5 block m-xs font-medium text-slate-700">
                  Pemberi instruksi <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  ref={(el) => { fields.current.tbakPemberi = el; }}
                  id={`${uid}-pemberi`}
                  name="tbakPemberi"
                  type="text"
                  autoComplete="off"
                  required
                  value={form.tbakPemberi}
                  onChange={(e) => onChange({ tbakPemberi: e.target.value })}
                  placeholder="DPJP yang memberi instruksi"
                  aria-invalid={!!errors.tbakPemberi || undefined}
                  aria-describedby={errors.tbakPemberi ? errId("tbakPemberi") : undefined}
                  className={INPUT}
                />
                <FieldError id={errId("tbakPemberi")}>{errors.tbakPemberi}</FieldError>
              </div>
              <fieldset>
                <legend className="mb-1.5 m-xs font-medium text-slate-700">Metode</legend>
                <div className="flex h-10 gap-1 rounded-lg bg-slate-100 p-1">
                  {TBAK_METODE_LIST.map((m) => {
                    const on = form.tbakMetode === m;
                    return (
                      <label
                        key={m}
                        className={cn(
                          "relative flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md px-3 m-xs font-semibold transition",
                          "has-focus-visible:ring-2 has-focus-visible:ring-rose-600",
                          on ? "bg-white text-rose-800 shadow-sm" : "text-slate-600 hover:text-slate-900",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${uid}-metode`}
                          value={m}
                          checked={on}
                          onChange={() => onChange({ tbakMetode: m })}
                          className="sr-only"
                        />
                        {m === "Telepon" && <Phone className="size-3" aria-hidden="true" />}
                        {m}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div>
              <NarasiField
                area={{ key: "instruksi", badge: "I", label: "Isi instruksi", placeholder: "Instruksi lengkap yang diterima (obat, dosis, rute, tindakan)...", badgeCls: "bg-rose-100 text-rose-800", rows: 3 }}
                value={form.instruksi}
                onChange={(v) => onChange({ instruksi: v })}
                invalid={!!errors.instruksi}
                errorId={errId("instruksi")}
                fieldRef={(el) => { fields.current.instruksi = el; }}
              />
              <FieldError id={errId("instruksi")}>{errors.instruksi}</FieldError>
            </div>

            <fieldset aria-describedby={errors.tbakSteps ? errId("tbakSteps") : undefined}>
              <legend className="mb-1.5 m-xs font-medium text-slate-700">
                Verifikasi Tulis–Baca–Konfirmasi <span aria-hidden="true" className="text-rose-600">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {TBAK_STEPS.map((s, i) => {
                  const on = form[s.key];
                  return (
                    <label
                      key={s.key}
                      className={cn(
                        "relative flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition",
                        "has-focus-visible:ring-2 has-focus-visible:ring-emerald-600",
                        on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <input
                        ref={i === 0 ? (el) => { fields.current.tbakSteps = el; } : undefined}
                        type="checkbox"
                        name={s.key}
                        checked={on}
                        onChange={(e) => onChange({ [s.key]: e.target.checked } as Partial<CPPTForm>)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-px flex size-5 shrink-0 items-center justify-center rounded-md border transition",
                          on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-400 bg-white",
                        )}
                      >
                        {on && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block m-xs font-semibold", on ? "text-emerald-800" : "text-slate-700")}>
                          {i + 1}. {s.label}
                        </span>
                        <span className="block m-tiny leading-tight text-slate-500">{s.ket}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldError id={errId("tbakSteps")}>{errors.tbakSteps}</FieldError>
            </fieldset>
          </div>
        )}

        {note && (
          <p role="status" className="m-xs text-slate-600">{note}</p>
        )}
      </div>

      {/* ── Footer lengket ── */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-2.5 rounded-b-2xl border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-white/85 sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 m-tiny text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="flex gap-0.5">
              {Array.from({ length: totalCount }, (_, i) => (
                <span key={i} className={cn("h-1.5 w-3 rounded-full transition-colors", i < filledCount ? jenisMeta.bar : "bg-slate-200")} />
              ))}
            </span>
            {filledCount}/{totalCount} {isTbak ? "langkah" : "bagian"} terisi
          </span>
          {needsVerify && <span>· perlu verifikasi DPJP</span>}
          <span className="hidden lg:inline">
            · <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-sans text-[10px]">Ctrl</kbd>+
            <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-sans text-[10px]">Enter</kbd> simpan
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => { setAttempted(false); setNote(""); onClear(); }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 m-xs font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500"
            >
              <Eraser className="size-3.5" aria-hidden="true" /> Kosongkan
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition sm:flex-none",
              "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70",
              editing
                ? "bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600"
                : "bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-600",
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {saving ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan catatan"}
          </button>
        </div>
      </div>
    </form>
  );
}
