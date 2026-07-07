"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, AlertTriangle, User } from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  type AnamnesisRJData,
  ASESMEN_RJ_MOCK,
} from "./asesmenAwalRJShared";
import AnamnesisSebelumnya from "@/components/shared/medical-records/AnamnesisSebelumnya";
import AnamnesisTemplatePicker, { type AnamnesisTemplateDTO } from "@/components/shared/medical-records/AnamnesisTemplatePicker";
import { getAnamnesis, saveAnamnesis } from "@/lib/api/asesmenMedis/anamnesis";
import type { SumberAnamnesis } from "@/lib/schemas/asesmenMedis/anamnesis";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";

// id kunjungan DB = UUID; id demo/seed ("rj-1") → tak tersimpan ke DB.
const ANAMNESIS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUMBER_OPTS: SumberAnamnesis[] = ["Pasien", "Keluarga", "Pengantar", "Rekam Medis"];

// ── Primitives ────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

const TA_CLS = "w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

function TA({ label, value, onChange, placeholder, rows = 2, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={TA_CLS} />
    </div>
  );
}

function Block({ title, badge, children }: { title?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{badge}</span>}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface Props {
  patient:    RJPatientDetail;
  onComplete?: (done: boolean) => void;
}

// ── Main component ────────────────────────────────────────

export default function AnamnesisPaneRJ({ patient, onComplete }: Props) {
  const mock = ASESMEN_RJ_MOCK[patient.noRM];

  const [form, setForm] = useState<AnamnesisRJData>({
    keluhanUtama:   mock?.keluhanUtama   ?? "",
    rps:            mock?.rps            ?? "",
    onsetDurasi:    mock?.onsetDurasi    ?? "",
    faktorPemberat: mock?.faktorPemberat ?? "",
    faktorPemerut:  mock?.faktorPemerut  ?? "",
    keadaanUmum:    mock?.keadaanUmum   ?? "",
    obatSaatIni:    mock?.obatSaatIni    ?? (patient.obatSaatIni ?? ""),
    savedAt: "",
  });

  const { session } = useSession();
  const isPersisted = ANAMNESIS_UUID_RE.test(patient.id);

  const [sumber, setSumber]   = useState<SumberAnamnesis>("Pasien");
  const [loading, setLoading] = useState(isPersisted);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const doneOf = (f: AnamnesisRJData) =>
    f.keluhanUtama.trim().length > 3 &&
    f.rps.trim().length > 10 &&
    f.keadaanUmum.trim().length > 3;

  // Muat anamnesis terbaru dari DB (kunjungan nyata, UUID). Demo (non-UUID) → tetap mock.
  // RJ: server `statusGeneralis` ↔ form `keadaanUmum`; `faktorPeringan` ↔ `faktorPemerut`.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getAnamnesis(patient.id, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted || !dto) return;
        setSumber((dto.sumberAnamnesis as SumberAnamnesis) ?? "Pasien");
        setForm((f) => ({
          ...f,
          keluhanUtama: dto.keluhanUtama,
          rps: dto.rps,
          onsetDurasi: dto.onsetDurasi ?? "",
          faktorPemberat: dto.faktorPemberat ?? "",
          faktorPemerut: dto.faktorPeringan ?? "",
          keadaanUmum: dto.statusGeneralis,
          obatSaatIni: dto.obatSaatIni ?? "",
        }));
        setSavedAt(dto.createdAt);
        onComplete?.(
          dto.keluhanUtama.trim().length > 3 &&
          dto.rps.trim().length > 10 &&
          dto.statusGeneralis.trim().length > 3,
        );
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!ac.signal.aborted) setError("Gagal memuat anamnesis dari rekam medis.");
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [patient.id, isPersisted, onComplete]);

  function set<K extends keyof AnamnesisRJData>(k: K, v: AnamnesisRJData[K]) {
    const updated = { ...form, [k]: v };
    setForm(updated);
    onComplete?.(doneOf(updated));
  }

  function applyTemplate(t: AnamnesisTemplateDTO) {
    const updated: AnamnesisRJData = {
      ...form,
      keluhanUtama:   t.keluhanUtama,
      rps:            t.rps,
      onsetDurasi:    t.onsetDurasi,
      faktorPemberat: t.faktorPemberat,
      faktorPemerut:  t.faktorPemerut,
      keadaanUmum:    t.statusGeneralis, // RJ: status generalis → keadaan umum
    };
    setForm(updated);
    onComplete?.(doneOf(updated));
  }

  async function handleSave() {
    if (!isPersisted) { setError("Pasien demo — anamnesis tidak tersimpan ke database."); return; }
    if (!form.keluhanUtama.trim() || !form.rps.trim() || !form.keadaanUmum.trim()) {
      setError("Lengkapi Keluhan Utama, RPS, dan Keadaan Umum (wajib).");
      return;
    }
    setSaving(true); setError(null);
    try {
      const dto = await saveAnamnesis(patient.id, {
        sumberAnamnesis: sumber,
        keluhanUtama: form.keluhanUtama,
        rps: form.rps,
        onsetDurasi: form.onsetDurasi || undefined,
        mekanismeCedera: undefined, // RJ tak fokus trauma
        faktorPemberat: form.faktorPemberat || undefined,
        faktorPeringan: form.faktorPemerut || undefined,
        statusGeneralis: form.keadaanUmum,
        obatSaatIni: form.obatSaatIni || undefined,
        // RJ tak mengoleksi psikososial/spiritual (RI-only) → biarkan undefined.
      });
      setSavedAt(dto.createdAt);
      onComplete?.(doneOf(form));
      toast.success("Asesmen anamnesis tersimpan", `${patient.name} · tercatat ke rekam medis.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan anamnesis.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">

      {/* ── Left: form ── */}
      <div className="flex flex-col gap-3 md:flex-1 md:min-w-0">

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <Loader2 size={13} className="animate-spin" /> Memuat anamnesis dari rekam medis…
          </div>
        )}

        {/* Sumber anamnesis — siapa pemberi keterangan (selaras IGD/RI) */}
        <div className="flex flex-wrap gap-2">
          <p className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Sumber Anamnesis<span className="ml-0.5 text-rose-400">*</span>
          </p>
          {SUMBER_OPTS.map((s) => (
            <button key={s} type="button" onClick={() => setSumber(s)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                sumber === s
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:bg-sky-50/40",
              )}>
              {s}
            </button>
          ))}
        </div>

        {/* Keluhan & RPS */}
        <Block title="Keluhan & Anamnesis" badge="Wajib">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Lengkapi riwayat penyakit sekarang</span>
            <AnamnesisTemplatePicker modul="RJ" onApply={applyTemplate} />
          </div>
          <TA label="Keluhan Utama" required value={form.keluhanUtama}
            onChange={v => set("keluhanUtama", v)}
            placeholder="Keluhan utama yang membawa pasien ke poliklinik..." />
          <TA label="Riwayat Penyakit Sekarang (RPS)" rows={4} required
            value={form.rps} onChange={v => set("rps", v)}
            placeholder="Kronologis keluhan: kapan mulai, bagaimana perkembangannya, gejala penyerta, sudah berobat sebelumnya..." />
          <div className="grid gap-3 sm:grid-cols-3">
            <TA label="Onset / Durasi"   value={form.onsetDurasi}    onChange={v => set("onsetDurasi", v)}    placeholder="Mendadak, ± 3 hari..." />
            <TA label="Faktor Pemberat"  value={form.faktorPemberat} onChange={v => set("faktorPemberat", v)} placeholder="Aktivitas, posisi..." />
            <TA label="Faktor Peringan"  value={form.faktorPemerut}  onChange={v => set("faktorPemerut", v)}  placeholder="Istirahat, obat..." />
          </div>
        </Block>

        {/* Keadaan Umum */}
        <Block title="Keadaan Umum" badge="Wajib">
          <p className="text-[11px] text-slate-400">Deskripsi singkat kondisi pasien saat diperiksa. Pemeriksaan fisik lengkap di tab Pemeriksaan Fisik.</p>
          <TA label="Status Generalis" rows={2} required value={form.keadaanUmum}
            onChange={v => set("keadaanUmum", v)}
            placeholder="Tampak sakit ringan/sedang/berat, kesadaran, posisi pasien..." />
        </Block>

        {/* Obat Saat Ini */}
        <Block title="Obat yang Sedang Diminum">
          <TA label="Daftar Obat" rows={3} value={form.obatSaatIni}
            onChange={v => set("obatSaatIni", v)}
            placeholder="Nama obat, dosis, frekuensi — satu per baris..." />
          <p className="text-[11px] text-slate-400">Riwayat obat lengkap ada di sub-tab Riwayat Medis.</p>
        </Block>

        <div className="flex flex-col items-end gap-2 pt-1">
          {error && (
            <div role="alert" className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
          {!error && savedAt && (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
              <Check size={13} className="shrink-0" /> Tersimpan · {savedAt.slice(0, 16).replace("T", " ")} WIB
            </div>
          )}
          {!isPersisted && !error && (
            <p className="text-[11px] text-amber-600">Pasien demo — perubahan tidak tersimpan ke database.</p>
          )}
          <div className="flex items-center gap-3">
            {isPersisted && (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <User size={12} className="text-slate-400" />
                Dicatat oleh <span className="font-semibold text-slate-700">{session?.namaTampil ?? "—"}</span>
              </span>
            )}
            <button type="button" onClick={handleSave} disabled={saving}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-medium text-white shadow-sm transition",
                saving ? "cursor-not-allowed bg-slate-300" : "bg-sky-600 hover:bg-sky-700",
              )}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Menyimpan…" : "Simpan Anamnesis"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Anamnesis Sebelumnya (longitudinal lintas kunjungan, read-only) ── */}
      <AnamnesisSebelumnya kunjunganId={patient.id} className="md:w-72 md:shrink-0" />

    </div>
  );
}
