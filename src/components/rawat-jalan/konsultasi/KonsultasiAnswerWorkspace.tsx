"use client";

// Halaman jawab konsultasi (sisi KONSULTAN) — di dalam shell modul (Navbar + Sidebar), konten
// full-width dipecah jadi WIDGET seimbang (bukan 1 panel monolitik):
//   kiri (2/3): Permintaan SBAR (terbuka penuh) + Jawaban Konsultasi (form/hasil)
//   kanan (1/3): Timeline Status (+ aksi Terima compact) + Detail Permintaan
// Fetch GET /konsultasi/:id; Terima → Jawab (auto-CPPT ke kunjungan asal, server); nama
// konsultan = sesi login (read-only). Gate clinical.konsultasi (scopeKunjungan:false).
// DetailPane shared TIDAK dipakai di sini (layout pane sempit ≠ layout halaman lebar) —
// vocab/config tetap dari konsultasiShared (anti-fork logika).

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, MessageSquare, User, AlertCircle, ClipboardList,
  UserCheck, CheckCircle2, CheckSquare, Clock, Building2, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  getKonsultasi, terimaKonsultasi, jawabKonsultasi, type KonsultasiWorklistDTO,
} from "@/lib/api/konsultasi/konsultasi";
import {
  URGENCY_CONFIG, STATUS_CONFIG, STATUS_STEPS, elapsedSince,
} from "@/components/shared/medical-records/konsultasi/konsultasiShared";

const UNIT_LABEL: Record<string, string> = {
  IGD: "IGD", RawatInap: "Rawat Inap", RawatJalan: "Rawat Jalan",
};

const SBAR_SECTIONS = [
  { key: "situation"      as const, label: "S — Situation",      color: "bg-sky-50 text-sky-700 border-sky-200" },
  { key: "background"     as const, label: "B — Background",     color: "bg-violet-50 text-violet-700 border-violet-200" },
  { key: "assessment"     as const, label: "A — Assessment",     color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "recommendation" as const, label: "R — Recommendation", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

// ── Kartu generik ──────────────────────────────────────────

function Card({
  icon: Icon, title, badge, children, className,
}: {
  icon: typeof ClipboardList; title: string; badge?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <Icon size={14} className="text-sky-500" />
        <p className="text-xs font-semibold text-slate-700">{title}</p>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ── Widget: Timeline status + aksi ─────────────────────────

function StatusCard({
  item, busy, onTerima,
}: {
  item: KonsultasiWorklistDTO; busy: boolean; onTerima: () => void;
}) {
  const stepIdx = STATUS_STEPS.indexOf(item.status as typeof STATUS_STEPS[number]);
  const waktuOf: Record<string, string | undefined> = {
    Terkirim: `${item.tanggalRequest} · ${item.waktuRequest}`,
    Diterima: item.waktuDiterima,
    Dijawab:  item.waktuDijawab,
    Selesai:  item.waktuSelesai,
  };
  const urgCfg = URGENCY_CONFIG[item.urgency];

  return (
    <Card
      icon={Clock}
      title="Status Konsultasi"
      badge={
        <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold", urgCfg.badge)}>
          SLA {urgCfg.time}
        </span>
      }
    >
      <div className="p-4">
        {/* Timeline vertikal */}
        <ol className="space-y-0">
          {STATUS_STEPS.map((step, i) => {
            const past    = stepIdx > i;
            const current = stepIdx === i;
            const last    = i === STATUS_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
                {!last && (
                  <span className={cn(
                    "absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px",
                    past ? "bg-emerald-300" : "bg-slate-200",
                  )} />
                )}
                <motion.span
                  animate={{
                    backgroundColor: past ? "#10b981" : current ? "#0284c7" : "#e2e8f0",
                    scale: current ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                >
                  {past
                    ? <CheckCircle2 size={13} className="text-white" />
                    : <span className={cn("text-[10px] font-bold", current ? "text-white" : "text-slate-400")}>{i + 1}</span>}
                </motion.span>
                <div className="min-w-0 pt-0.5">
                  <p className={cn("text-xs font-semibold leading-none", past || current ? "text-slate-700" : "text-slate-400")}>
                    {step}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {waktuOf[step] ?? (current ? "sedang berjalan" : "—")}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          Dikirim {elapsedSince(item.tanggalRequest, item.waktuRequest)} yang lalu
        </p>

        {/* Aksi compact per status */}
        {item.status === "Terkirim" && (
          <button
            onClick={onTerima}
            disabled={busy}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-95 disabled:opacity-60"
          >
            <UserCheck size={13} />
            {busy ? "Memproses…" : "Terima Konsultasi"}
          </button>
        )}
        {item.status === "Diterima" && (
          <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-700 ring-1 ring-sky-100">
            Diterima {item.waktuDiterima ?? ""} — silakan isi jawaban di panel kiri.
          </p>
        )}
        {item.status === "Dijawab" && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 ring-1 ring-amber-100">
            Jawaban terkirim — menunggu konfirmasi DPJP peminta.
          </p>
        )}
        {item.status === "Selesai" && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 ring-1 ring-emerald-100">
            Closed-loop selesai — dikonfirmasi DPJP peminta.
          </p>
        )}
      </div>
    </Card>
  );
}

// ── Widget: detail permintaan ──────────────────────────────

function InfoCard({ item }: { item: KonsultasiWorklistDTO }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "SMF Tujuan",
      value: (
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">{item.smfSingkatan}</span>
          <span className="font-semibold text-slate-700">{item.smfNama}</span>
        </span>
      ),
    },
    { label: "Dokter Dituju",  value: item.dokterKonsultan ?? <span className="italic text-slate-400">Semua dokter SMF</span> },
    { label: "Dokter Peminta", value: item.dokterPeminta },
    { label: "Unit Asal",      value: UNIT_LABEL[item.unitAsal] ?? item.unitAsal },
    { label: "No. Kunjungan",  value: item.noKunjungan },
  ];
  return (
    <Card icon={Stethoscope} title="Detail Permintaan">
      <dl className="divide-y divide-slate-50 px-4 py-1">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2">
            <dt className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="min-w-0 truncate text-right text-xs text-slate-600">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// ── Widget: jawaban (form / hasil) ─────────────────────────

interface JawabForm { asesmen: string; rekomendasi: string; tindakLanjut: string; followUp: string }

const JAWAB_FIELDS: { key: keyof Omit<JawabForm, "followUp">; label: string; rows: number; hint: string }[] = [
  { key: "asesmen",      label: "Asesmen Konsultan", rows: 3, hint: "Penilaian klinis Anda atas kasus yang dikonsulkan" },
  { key: "rekomendasi",  label: "Rekomendasi",       rows: 5, hint: "Terapi/tindakan yang direkomendasikan (boleh poin-poin)" },
  { key: "tindakLanjut", label: "Tindak Lanjut",     rows: 2, hint: "Rencana evaluasi/monitoring berikutnya" },
];

function JawabanCard({
  item, konsultanNama, busy, cpptNotif, onJawab,
}: {
  item: KonsultasiWorklistDTO; konsultanNama?: string; busy: boolean;
  cpptNotif: boolean; onJawab: (f: JawabForm) => void;
}) {
  const [form, setForm] = useState<JawabForm>({ asesmen: "", rekomendasi: "", tindakLanjut: "", followUp: "" });
  const valid = !!form.asesmen.trim() && !!form.rekomendasi.trim() && !!form.tindakLanjut.trim();

  return (
    <Card
      icon={UserCheck}
      title="Jawaban Konsultasi"
      badge={item.jawaban ? (
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200">
          Terjawab {item.waktuDijawab ?? ""}
        </span>
      ) : undefined}
    >
      {/* Notif CPPT otomatis */}
      <AnimatePresence>
        {cpptNotif && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5"
          >
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-[11px] text-emerald-700">
              <span className="font-semibold">Entry CPPT dibuat otomatis</span> — jawaban tercatat di
              rekam medis kunjungan asal.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {item.jawaban ? (
        /* ── Hasil jawaban ── */
        <div className="divide-y divide-emerald-50">
          <div className="flex items-center gap-2 bg-emerald-50/50 px-4 py-2">
            <UserCheck size={12} className="text-emerald-600" />
            <p className="text-[11px] font-semibold text-emerald-700">{item.jawaban.konsultan}</p>
          </div>
          {([
            ["Asesmen", item.jawaban.asesmen],
            ["Rekomendasi", item.jawaban.rekomendasi],
            ["Tindak Lanjut", item.jawaban.tindakLanjut],
          ] as const).map(([label, val]) => (
            <div key={label} className="px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">{label}</p>
              <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">{val}</p>
            </div>
          ))}
          {item.jawaban.followUp && (
            <div className="flex items-center gap-2 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Kontrol Kembali</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {item.jawaban.followUp}
              </span>
            </div>
          )}
        </div>
      ) : item.status === "Terkirim" ? (
        /* ── Belum diterima ── */
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <UserCheck size={22} className="text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">Konsultasi belum diterima</p>
          <p className="text-[11px] text-slate-400">
            Klik <span className="font-semibold text-sky-600">Terima Konsultasi</span> pada panel
            Status untuk mulai mengisi jawaban.
          </p>
        </div>
      ) : (
        /* ── Form jawaban (status Diterima) ── */
        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Nama Konsultan</label>
              <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50/50 px-3 py-2">
                <span className="truncate text-xs font-semibold text-slate-800">
                  {konsultanNama ?? item.dokterKonsultan ?? "Dokter Konsultan"}
                </span>
                {konsultanNama && (
                  <span className="ml-2 shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-600">
                    Sesi Login
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Kontrol / Follow Up <span className="font-normal text-slate-400">(opsional)</span>
              </label>
              <input
                type="date"
                value={form.followUp}
                onChange={(e) => setForm((f) => ({ ...f, followUp: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
              />
            </div>
          </div>

          {JAWAB_FIELDS.map(({ key, label, rows, hint }) => (
            <div key={key}>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label} <span className="text-red-500">*</span></label>
              <textarea
                rows={rows}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={hint}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
              />
            </div>
          ))}

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button
              onClick={() => valid && onJawab(form)}
              disabled={!valid || busy}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition active:scale-95",
                valid && !busy
                  ? "bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                  : "cursor-not-allowed bg-slate-100 text-slate-400",
              )}
            >
              <CheckSquare size={13} />
              {busy ? "Mengirim…" : "Kirim Jawaban"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main ───────────────────────────────────────────────────

export default function KonsultasiAnswerWorkspace({ konsultasiId }: { konsultasiId: string }) {
  const { session } = useSession();
  const [item,    setItem]    = useState<KonsultasiWorklistDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [busy,    setBusy]    = useState(false);
  const [cpptNotif, setCpptNotif] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    getKonsultasi(konsultasiId, ac.signal)
      .then((dto) => { if (!ac.signal.aborted) setItem(dto); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : "Gagal memuat konsultasi");
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [konsultasiId]);

  async function handleTerima() {
    if (busy) return;
    setBusy(true);
    try {
      setItem(await terimaKonsultasi(konsultasiId));
      toast.success("Konsultasi diterima", "Silakan isi jawaban konsultasi");
    } catch (e) {
      toast.error("Gagal menerima konsultasi", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function handleJawab(f: JawabForm) {
    if (busy) return;
    setBusy(true);
    try {
      setItem(await jawabKonsultasi(konsultasiId, {
        asesmen: f.asesmen,
        rekomendasi: f.rekomendasi,
        tindakLanjut: f.tindakLanjut,
        followUp: f.followUp || undefined,
        konsultan: undefined, // server otoritatif dari actor (sesi login)
      }));
      setCpptNotif(true);
      toast.success("Jawaban terkirim", "Tercatat otomatis di CPPT kunjungan asal");
    } catch (e) {
      toast.error("Gagal mengirim jawaban", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">

      {/* ── Header ── */}
      <header className="animate-fade-in flex flex-wrap items-center gap-3">
        <Link
          href="/ehis-care/rawat-jalan"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <ArrowLeft size={13} /> Rawat Jalan
        </Link>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
          <MessageSquare size={16} className="text-sky-600" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-slate-900">
            Jawab Konsultasi{item ? ` — ${item.smfNama}` : ""}
          </h1>
          <p className="text-sm text-slate-400">Worklist konsultan antar-SMF · SNARS SKP 2</p>
        </div>
        {item && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", URGENCY_CONFIG[item.urgency].badge)}>
              {item.urgency}
            </span>
            <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold", STATUS_CONFIG[item.status].badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[item.status].dot)} />
              {STATUS_CONFIG[item.status].label}
            </span>
          </div>
        )}
      </header>

      {/* ── Identitas pasien ── */}
      {item && (
        <div className="animate-fade-in flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
          <p className="text-sm font-bold text-slate-800">{item.pasienNama}</p>
          <p className="text-xs text-slate-500">{item.noRM} · {item.noKunjungan}</p>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
            <Building2 size={10} /> {UNIT_LABEL[item.unitAsal] ?? item.unitAsal}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <User size={11} /> {item.dokterPeminta}
          </span>
          <span className="ml-auto text-[11px] text-slate-400">
            Dikirim {item.tanggalRequest} · {item.waktuRequest}
          </span>
        </div>
      )}

      {/* ── Tab tunggal (pola pill-tab RJPageView) ── */}
      <div className="animate-fade-in flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <span className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm">
          <MessageSquare size={13} />
          Jawab Konsultasi
        </span>
      </div>

      {/* ── Konten ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs">Memuat konsultasi…</span>
        </div>
      ) : error || !item ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
          <AlertCircle size={22} className="text-rose-400" />
          <p className="text-sm font-semibold text-slate-700">Konsultasi tidak ditemukan</p>
          <p className="text-xs text-slate-400">{error ?? "Periksa kembali tautan worklist"}</p>
        </div>
      ) : (
        <div className="animate-fade-in grid items-start gap-4 xl:grid-cols-3">

          {/* Kolom kiri (2/3): SBAR + Jawaban */}
          <div className="flex flex-col gap-4 xl:col-span-2">
            <Card
              icon={ClipboardList}
              title="Permintaan SBAR"
              badge={
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                  {item.dokterPeminta}
                </span>
              }
            >
              <div className="divide-y divide-slate-50">
                {SBAR_SECTIONS.map(({ key, label, color }) => (
                  <div key={key} className="px-4 py-3">
                    <span className={cn("mb-1.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold", color)}>
                      {label}
                    </span>
                    <p className="text-xs leading-relaxed text-slate-700">
                      {item[key] || <span className="italic text-slate-300">—</span>}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <JawabanCard
              item={item}
              konsultanNama={session?.namaTampil}
              busy={busy}
              cpptNotif={cpptNotif}
              onJawab={(f) => void handleJawab(f)}
            />
          </div>

          {/* Kolom kanan (1/3): status + detail */}
          <div className="flex flex-col gap-4">
            <StatusCard item={item} busy={busy} onTerima={() => void handleTerima()} />
            <InfoCard item={item} />
          </div>
        </div>
      )}
    </div>
  );
}
