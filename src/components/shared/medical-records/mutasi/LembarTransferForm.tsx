"use client";

// Lembar transfer pasien antar ruangan (OPSIONAL). Tata letak per bagian (judul kiri · isian kanan,
// bertumpuk di ponsel) + navigasi bagian yang menempel di atas (centang = bagian terisi) + footer
// simpan yang menempel di bawah. TTV ringkas (TD sistolik/diastolik satu baris) dengan penanda
// "di luar normal"; GCS dengan total + interpretasi; "Ambil TTV terakhir" dari tab TTV.
// Pengisi = akun login (server); waktu transfer = jam dinding RS (dikonversi server).

import { useId, useState, type FormEvent } from "react";
import { Activity, ArrowRight, Check, ClipboardList, Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { DateTimePicker } from "@/components/shared/inputs";
import { toLocalInputValue } from "@/lib/time/localTime";
import { listObservasi } from "@/lib/api/observation";
import {
  ALAT_TERPASANG, DOKUMEN_DIBAWA, KESADARAN, KONDISI_UMUM, PENDAMPING, RISIKO,
  type LembarTransferInput, type MutasiDTO,
} from "@/lib/api/mutasi";
import { AutoTextarea } from "../cppt/AutoTextarea";
import { latestObservation } from "../cppt/ttvSnippet";
import { BTN, lokasiLabel } from "./mutasiUi";
import {
  ChoicePills, Field, FormSection, INPUT, TEXTAREA, ToggleChips, VitalInput, gcsInfo,
} from "./lembarFields";

type NumKey = "gcsE" | "gcsV" | "gcsM" | "tdSistolik" | "tdDiastolik" | "nadi" | "respirasi" | "suhu" | "spo2" | "skalaNyeri";
const NUM_KEYS: NumKey[] = ["gcsE", "gcsV", "gcsM", "tdSistolik", "tdDiastolik", "nadi", "respirasi", "suhu", "spo2", "skalaNyeri"];
type Draft = Omit<LembarTransferInput, NumKey> & Record<NumKey, string>;

const toNum = (s: string): number | undefined => {
  const t = s.trim().replace(",", ".");
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};
const out = (s: string, lo: number, hi: number) => {
  const n = toNum(s);
  return n != null && (n < lo || n > hi);
};

function toDraft(m: MutasiDTO): Draft {
  const l = m.lembarTransfer;
  return {
    waktuTransfer: toLocalInputValue(l?.waktuTransfer ?? new Date().toISOString()),
    diagnosa: l?.diagnosa,
    kondisiUmum: l?.kondisiUmum,
    kesadaran: l?.kesadaran,
    alatTerpasang: l?.alatTerpasang ?? [],
    alatLain: l?.alatLain,
    obatCairan: l?.obatCairan,
    risiko: l?.risiko ?? [],
    perhatian: l?.perhatian,
    dokumenDibawa: l?.dokumenDibawa ?? [],
    pendamping: l?.pendamping,
    petugasPenerima: l?.petugasPenerima,
    catatan: l?.catatan,
    ...(Object.fromEntries(NUM_KEYS.map((k) => [k, l?.[k] == null ? "" : String(l[k])])) as Record<NumKey, string>),
  };
}

const KU_TONE = { Baik: "emerald", Sedang: "sky", Lemah: "amber", Kritis: "rose" } as const;

export function LembarTransferForm({
  m, kunjunganId, penulis, busy, onSave, onClose,
}: {
  m: MutasiDTO;
  kunjunganId: string;
  penulis: string | null;
  busy: boolean;
  onSave: (input: LembarTransferInput) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const sid = (s: string) => `${uid}-${s}`.replace(/:/g, "");
  const [d, setD] = useState<Draft>(() => toDraft(m));
  const [waktuErr, setWaktuErr] = useState(false);
  const [ttvNote, setTtvNote] = useState("");
  const [ttvBusy, setTtvBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const gcsVals = [toNum(d.gcsE), toNum(d.gcsV), toNum(d.gcsM)];
  const gcsTotal = gcsVals.every((x) => x != null) ? gcsVals.reduce<number>((a, b) => a + (b ?? 0), 0) : null;
  const gcs = gcsTotal != null ? gcsInfo(gcsTotal) : null;
  const tdAbnormal = out(d.tdSistolik, 90, 139) || out(d.tdDiastolik, 60, 89);

  const filled = {
    waktu: !!d.diagnosa?.trim(),
    kondisi: !!(d.kondisiUmum || d.kesadaran || gcsTotal),
    ttv: ["tdSistolik", "tdDiastolik", "nadi", "respirasi", "suhu", "spo2", "skalaNyeri"].some((k) => d[k as NumKey].trim()),
    alat: d.alatTerpasang.length > 0 || !!d.alatLain?.trim() || !!d.obatCairan?.trim(),
    risiko: d.risiko.length > 0 || !!d.perhatian?.trim(),
    serah: d.dokumenDibawa.length > 0 || !!d.pendamping || !!d.petugasPenerima?.trim() || !!d.catatan?.trim(),
  };
  const sections = [
    { key: "waktu", label: "Waktu & diagnosa" },
    { key: "kondisi", label: "Kondisi" },
    { key: "ttv", label: "Tanda vital" },
    { key: "alat", label: "Alat & terapi" },
    { key: "risiko", label: "Risiko" },
    { key: "serah", label: "Serah terima" },
  ] as const;
  const jumlahTerisi = Object.values(filled).filter(Boolean).length;

  const jumpTo = (key: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(sid(key))?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };

  const ambilTtv = async () => {
    setTtvBusy(true);
    setTtvNote("");
    try {
      const o = latestObservation(await listObservasi(kunjunganId));
      if (!o) { setTtvNote("Belum ada TTV tercatat untuk kunjungan ini."); return; }
      const v = o.vitalSigns;
      setD((p) => ({
        ...p,
        tdSistolik: String(v.tdSistolik), tdDiastolik: String(v.tdDiastolik), nadi: String(v.nadi),
        respirasi: String(v.respirasi), suhu: String(v.suhu), spo2: String(v.spo2), skalaNyeri: String(v.skalaNyeri),
        gcsE: String(v.gcsEye), gcsV: String(v.gcsVerbal), gcsM: String(v.gcsMotor),
        kesadaran: KESADARAN.find((k) => k === o.statusKesadaran.replace("_", " ")) ?? p.kesadaran,
      }));
      setTtvNote(`TTV ${o.jam} oleh ${o.perawat} dimasukkan — periksa ulang sebelum menyimpan.`);
    } catch {
      setTtvNote("TTV tidak dapat dimuat — periksa akses atau koneksi.");
    } finally {
      setTtvBusy(false);
    }
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    if (!d.waktuTransfer) {
      setWaktuErr(true);
      jumpTo("waktu");
      document.getElementById(sid("waktu-input"))?.focus();
      return;
    }
    const nums = Object.fromEntries(NUM_KEYS.map((k) => [k, toNum(d[k])])) as Partial<Record<NumKey, number>>;
    onSave({ ...d, ...nums } as LembarTransferInput);
  };

  const ttvAction = (
    <button
      type="button"
      onClick={() => void ambilTtv()}
      disabled={ttvBusy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 m-tiny font-semibold text-teal-800 transition hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-60"
    >
      {ttvBusy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Activity className="size-3.5" aria-hidden="true" />}
      Ambil TTV terakhir
    </button>
  );

  return (
    <form noValidate onSubmit={submit} aria-labelledby={sid("title")} className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ── Kepala + navigasi bagian (menempel) ── */}
      <div className="sticky top-0 z-20 rounded-t-2xl border-b border-slate-100 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/85">
        <div className="flex items-center gap-3 px-4 pt-3.5 sm:px-5">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <ClipboardList className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={sid("title")} className="m-sm font-semibold text-slate-900">Lembar transfer pasien</h3>
            <p className="flex min-w-0 items-center gap-1 truncate m-tiny text-slate-500">
              <span className="truncate">{lokasiLabel(m.dari)}</span>
              <ArrowRight className="size-3 shrink-0" role="img" aria-label="ke" />
              <span className="truncate font-medium text-sky-800">{lokasiLabel(m.ke)}</span>
              <span className="shrink-0">· opsional</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup lembar transfer"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Bagian lembar transfer" className="px-4 pt-3 pb-2.5 sm:px-5">
          <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {sections.map((s) => {
              const ok = filled[s.key];
              return (
                <li key={s.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => jumpTo(s.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 m-tiny font-medium transition",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-600",
                      ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {ok
                      ? <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                      : <span aria-hidden="true" className="size-1.5 rounded-full bg-slate-300" />}
                    {s.label}
                    <span className="sr-only">{ok ? " (terisi)" : " (kosong)"}</span>
                  </button>
                </li>
              );
            })}
            <li className="ml-auto shrink-0 self-center pl-2 m-tiny tabular-nums text-slate-500">{jumlahTerisi}/6 terisi</li>
          </ul>
        </nav>
      </div>

      {/* ── Bagian ── */}
      <FormSection id={sid("waktu")} title="Waktu & diagnosa" desc="Kapan pasien dipindah dan diagnosa kerja saat transfer." done={filled.waktu}>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={sid("waktu-input")} className="m-xs font-medium text-slate-700">
              Waktu transfer <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <DateTimePicker id={sid("waktu-input")} value={d.waktuTransfer} onChange={(v) => { set("waktuTransfer", v); setWaktuErr(false); }} />
            {waktuErr && <p role="alert" className="m-xs font-medium text-rose-700">Isi waktu transfer.</p>}
          </div>
          <Field id={sid("diag")} label="Diagnosa">
            <input id={sid("diag")} type="text" maxLength={500} value={d.diagnosa ?? ""} onChange={(e) => set("diagnosa", e.target.value)} className={INPUT} />
          </Field>
        </div>
      </FormSection>

      <FormSection id={sid("kondisi")} title="Kondisi pasien" desc="Keadaan umum, kesadaran, dan GCS saat diserahkan." done={filled.kondisi}>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChoicePills legend="Keadaan umum" options={KONDISI_UMUM} value={d.kondisiUmum} onChange={(v) => set("kondisiUmum", v)} tone={(o) => KU_TONE[o]} />
          <ChoicePills legend="Kesadaran" options={KESADARAN} value={d.kesadaran} onChange={(v) => set("kesadaran", v)} />
        </div>
        <fieldset className="min-w-0">
          <legend className="mb-1.5 m-xs font-medium text-slate-700">GCS</legend>
          <div className="flex flex-wrap items-end gap-2">
            {([["gcsE", "E", 4], ["gcsV", "V", 5], ["gcsM", "M", 6]] as const).map(([k, l, max]) => (
              <div key={k} className="flex w-20 flex-col gap-1">
                <label htmlFor={sid(k)} className="m-tiny font-medium text-slate-600">{l} <span className="text-slate-400">(1–{max})</span></label>
                <input
                  id={sid(k)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d[k]}
                  onChange={(e) => set(k, e.target.value.replace(/\D/g, ""))}
                  className={cn(INPUT, "text-center tabular-nums", out(d[k], 1, max) && "border-rose-400 bg-rose-50/50")}
                />
              </div>
            ))}
            <div aria-live="polite" className="flex h-9 items-center gap-2 pl-1">
              {gcsTotal != null && gcs ? (
                <>
                  <span className="m-sm font-bold tabular-nums text-slate-900">= {gcsTotal}</span>
                  <span className={cn("rounded-full px-2 py-0.5 m-tiny font-semibold ring-1 ring-inset", gcs.cls)}>{gcs.label}</span>
                </>
              ) : (
                <span className="m-tiny text-slate-400">Total tampil setelah E, V, M terisi</span>
              )}
            </div>
          </div>
        </fieldset>
      </FormSection>

      <FormSection id={sid("ttv")} title="Tanda vital" desc="Saat pasien diserahkan. Nilai di luar batas normal ditandai." done={filled.ttv} action={ttvAction}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
          <fieldset
            aria-describedby={tdAbnormal ? sid("td-flag") : undefined}
            className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1 2xl:col-span-2"
          >
            <legend className="mb-1.5 m-xs font-medium text-slate-700">Tekanan darah</legend>
            <div className={cn(
              "flex h-9 items-center rounded-lg border bg-white transition focus-within:border-sky-500 focus-within:ring-[3px] focus-within:ring-sky-500/15",
              tdAbnormal ? "border-amber-400 bg-amber-50/50" : "border-slate-300 hover:border-slate-400",
            )}>
              <label htmlFor={sid("td-s")} className="sr-only">Sistolik (mmHg)</label>
              <input
                id={sid("td-s")}
                type="text" inputMode="numeric" autoComplete="off" maxLength={3}
                value={d.tdSistolik}
                onChange={(e) => set("tdSistolik", e.target.value.replace(/\D/g, ""))}
                className="h-full w-full min-w-0 bg-transparent px-3 text-right text-base tabular-nums text-slate-900 outline-none sm:text-sm"
              />
              <span aria-hidden="true" className="text-slate-400">/</span>
              <label htmlFor={sid("td-d")} className="sr-only">Diastolik (mmHg)</label>
              <input
                id={sid("td-d")}
                type="text" inputMode="numeric" autoComplete="off" maxLength={3}
                value={d.tdDiastolik}
                onChange={(e) => set("tdDiastolik", e.target.value.replace(/\D/g, ""))}
                className="h-full w-full min-w-0 bg-transparent px-3 text-base tabular-nums text-slate-900 outline-none sm:text-sm"
              />
              <span aria-hidden="true" className="shrink-0 pr-3 m-tiny text-slate-400">mmHg</span>
            </div>
            {tdAbnormal && <p id={sid("td-flag")} className="m-tiny font-medium text-amber-800">Di luar normal (90–139 / 60–89)</p>}
          </fieldset>
          <VitalInput id={sid("nadi")} label="Nadi" unit="x/mnt" value={d.nadi} onChange={(v) => set("nadi", v)} abnormal={out(d.nadi, 60, 100)} />
          <VitalInput id={sid("rr")} label="Napas" unit="x/mnt" value={d.respirasi} onChange={(v) => set("respirasi", v)} abnormal={out(d.respirasi, 12, 20)} />
          <VitalInput id={sid("suhu")} label="Suhu" unit="°C" decimal value={d.suhu} onChange={(v) => set("suhu", v)} abnormal={out(d.suhu, 36, 37.4)} />
          <VitalInput id={sid("spo2")} label="SpO₂" unit="%" value={d.spo2} onChange={(v) => set("spo2", v)} abnormal={out(d.spo2, 95, 100)} />
          <VitalInput id={sid("nyeri")} label="Skala nyeri" unit="/10" value={d.skalaNyeri} onChange={(v) => set("skalaNyeri", v)} abnormal={out(d.skalaNyeri, 0, 3)} abnormalText="Nyeri sedang–berat" />
        </div>
        {ttvNote && <p role="status" className="m-xs text-slate-600">{ttvNote}</p>}
      </FormSection>

      <FormSection id={sid("alat")} title="Alat & terapi" desc="Alat yang terpasang dan obat/cairan yang sedang berjalan." done={filled.alat}>
        <ToggleChips legend="Alat terpasang" options={ALAT_TERPASANG} values={d.alatTerpasang} onChange={(v) => set("alatTerpasang", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={sid("alat-lain")} label="Alat lain">
            <input id={sid("alat-lain")} type="text" maxLength={300} value={d.alatLain ?? ""} onChange={(e) => set("alatLain", e.target.value)} className={INPUT} />
          </Field>
          <Field id={sid("obat")} label="Obat / cairan berjalan">
            <AutoTextarea id={sid("obat")} maxLength={1500} value={d.obatCairan ?? ""} onChange={(e) => set("obatCairan", e.target.value)} className={TEXTAREA} />
          </Field>
        </div>
      </FormSection>

      <FormSection id={sid("risiko")} title="Risiko & perhatian" desc="Hal yang wajib diketahui petugas ruangan tujuan." done={filled.risiko}>
        <ToggleChips legend="Risiko" options={RISIKO} values={d.risiko} onChange={(v) => set("risiko", v)} tone="rose" />
        <Field id={sid("perhatian")} label="Hal yang perlu diperhatikan">
          <AutoTextarea id={sid("perhatian")} maxLength={1500} value={d.perhatian ?? ""} onChange={(e) => set("perhatian", e.target.value)} className={TEXTAREA} />
        </Field>
      </FormSection>

      <FormSection id={sid("serah")} title="Serah terima" desc="Dokumen, pendamping, dan petugas yang menerima." done={filled.serah}>
        <ToggleChips legend="Dokumen yang dibawa" options={DOKUMEN_DIBAWA} values={d.dokumenDibawa} onChange={(v) => set("dokumenDibawa", v)} tone="sky" />
        <div className="grid gap-4 md:grid-cols-2">
          <ChoicePills legend="Pendamping" options={PENDAMPING} value={d.pendamping} onChange={(v) => set("pendamping", v)} />
          <Field id={sid("penerima")} label="Petugas penerima" hint={<p className="m-tiny text-slate-500">Perawat di ruangan tujuan</p>}>
            <input id={sid("penerima")} type="text" autoComplete="off" maxLength={120} value={d.petugasPenerima ?? ""} onChange={(e) => set("petugasPenerima", e.target.value)} className={INPUT} />
          </Field>
        </div>
        <Field id={sid("catatan")} label="Catatan tambahan">
          <AutoTextarea id={sid("catatan")} maxLength={1500} value={d.catatan ?? ""} onChange={(e) => set("catatan", e.target.value)} className={TEXTAREA} />
        </Field>
      </FormSection>

      {/* ── Footer (menempel) ── */}
      <div className="sticky bottom-0 z-20 flex flex-col gap-2.5 rounded-b-2xl border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-white/85 sm:flex-row sm:items-center sm:px-5">
        <p className="min-w-0 flex-1 m-xs text-slate-600">
          Diisi oleh <b className="font-semibold text-slate-800">{penulis || "akun Anda"}</b> (pengantar)
          {m.lembarDiisiAt && <span className="text-slate-500"> · tersimpan {new Date(m.lembarDiisiAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cn(BTN, "text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500")}>
            Tutup
          </button>
          <button type="submit" disabled={busy} className={cn(BTN, "bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:outline-sky-600")}>
            {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Save className="size-3.5" aria-hidden="true" />}
            {busy ? "Menyimpan…" : "Simpan lembar"}
          </button>
        </div>
      </div>
    </form>
  );
}
