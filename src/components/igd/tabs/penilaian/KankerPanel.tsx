"use client";

// Penilaian Kanker — asesmen KOMPOSIT: narasi + vocab bespoke (histologi, TNM, metastasis) +
// klasifikasi baku (ECOG/Grade/Stadium) yang DIKOMPOSISI dari master Skala Penyakit. TNM (T/N/M)
// TETAP vocab bespoke (staging = lookup site-specific, bukan skala). Disimpan snapshot ke
// medicalrecord.penilaian_komposit (jenis "Kanker", append-only). Skoring = single source master.

import { useEffect, useMemo, useState } from "react";
import { Microscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  TwoPanel, HistoryPanel, SectionHead, Label, SaveBtn, AutoTextarea, inputCls, toggleItem,
  ScaleField, computeScale, NOTE_DATE_FMT,
  type NoteEntry, type PanelCtx, type ScaleInstrument, type ScaleScores,
} from "./shared";
import { listSkalaTersedia } from "@/lib/api/penilaian/penilaianSkala";
import {
  getPenilaianKomposit, createPenilaianKomposit, type PenilaianKompositDTO,
} from "@/lib/api/penilaian/penilaianKomposit";

// Klasifikasi onkologi dikenali dari nama instrumen master (kode auto SP-NNNN → match by nama).
const ONKO_MATCH = /ecog|grade|stadium/i;

const HISTOLOGI_OPTS = ["Karsinoma", "Adenokarsinoma", "Karsinoma Sel Skuamosa", "Sarkoma", "Limfoma", "Leukemia", "Melanoma", "Sel Kecil", "Karsinoid", "Lainnya"];
const LATERALITAS_OPTS = ["Kanan", "Kiri", "Bilateral", "Garis Tengah", "Tidak Aplikabel"];
const T_OPTS = ["TX", "T0", "Tis", "T1", "T1a", "T1b", "T2", "T2a", "T2b", "T3", "T4", "T4a", "T4b"];
const N_OPTS = ["NX", "N0", "N1", "N1a", "N1b", "N2", "N2a", "N2b", "N3"];
const M_OPTS = ["MX", "M0", "M1", "M1a", "M1b", "M1c"];
const METASTASIS_LOKASI = ["Paru", "Hati", "Tulang", "Otak", "KGB Regional", "KGB Jauh", "Ginjal", "Adrenal", "Peritoneum", "Pleura", "Lainnya"];

const EMPTY = { jenisTumor: "", lokasiPrimer: "", lateralitas: "", tStage: "", nStage: "", mStage: "", perluasan: "", metastasisStatus: "", metastasisCatatan: "", kesimpulan: "" };

function kompositToNote(d: PenilaianKompositDTO): NoteEntry {
  const lines: string[] = [];
  const dt = d.data ?? {};
  const tnm = [dt.tStage, dt.nStage, dt.mStage].filter(Boolean).join(" ");
  if (dt.jenisTumor) lines.push(`Tumor: ${dt.jenisTumor}${tnm ? ` (${tnm})` : ""}`);
  if (d.ringkasan && d.ringkasan !== dt.jenisTumor) lines.push(d.ringkasan);
  const skala = Array.isArray(dt.skala) ? (dt.skala as Array<Record<string, unknown>>) : [];
  skala.forEach((s) => lines.push(`• ${s.skalaNama}: ${s.totalSkor}${s.interpretasiLabel ? ` — ${s.interpretasiLabel}` : ""}`));
  return { date: d.tanggal, author: d.pemeriksa || "—", content: lines.join("\n") || "(tanpa ringkasan)", tag: "Kanker" };
}

export default function KankerPanel({ kunjunganId, isPersisted, perawat, modul }: PanelCtx) {
  const [form, setForm] = useState(EMPTY);
  const [histologi, setHistologi] = useState<string[]>([]);
  const [metastasisLokasi, setMetastasisLokasi] = useState<string[]>([]);
  const [scaleScores, setScaleScores] = useState<Record<string, ScaleScores>>({});
  const [instruments, setInstruments] = useState<ScaleInstrument[]>([]);
  const [history, setHistory] = useState<NoteEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const ac = new AbortController();
    listSkalaTersedia({ modul, kategori: "Penyakit" }, ac.signal)
      .then((rows) => setInstruments(rows.filter((r) => ONKO_MATCH.test(r.nama))))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat klasifikasi onkologi", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [modul]);

  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenilaianKomposit(kunjunganId, "Kanker", ac.signal)
      .then((rows) => setHistory(rows.map(kompositToNote)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat penilaian kanker", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const onScore = (kode: string, itemId: string, score: number) =>
    setScaleScores((p) => ({ ...p, [kode]: { ...(p[kode] ?? {}), [itemId]: score } }));

  const tnmDisplay = [form.tStage, form.nStage, form.mStage].filter(Boolean).join(" ");

  const isEmpty = useMemo(() => {
    const anyText = Object.values(form).some((v) => v.trim()) || histologi.length > 0 || metastasisLokasi.length > 0;
    const anyScale = instruments.some((ins) => computeScale(ins, scaleScores[ins.kode] ?? {}).allFilled);
    return !anyText && !anyScale;
  }, [form, histologi, metastasisLokasi, instruments, scaleScores]);

  function reset() {
    setForm(EMPTY); setHistologi([]); setMetastasisLokasi([]); setScaleScores({});
  }

  function buildData() {
    const skala = instruments
      .map((ins) => ({ ins, r: computeScale(ins, scaleScores[ins.kode] ?? {}) }))
      .filter((x) => x.r.allFilled)
      .map(({ ins, r }) => ({
        skalaKode: ins.kode, skalaNama: ins.nama, totalSkor: r.total, totalMax: ins.totalMax,
        interpretasiLabel: r.interp?.label ?? "", interpretasiTone: r.interp?.tone ?? "", jawaban: r.jawaban,
      }));
    return { ...form, histologi, metastasisLokasi, skala };
  }

  async function handleSave() {
    if (isEmpty || saving) return;
    const data = buildData();
    const ringkasan = form.kesimpulan || form.jenisTumor || "";
    const payload = { jenis: "Kanker" as const, ringkasan: ringkasan || undefined, data };
    if (!isPersisted) {
      const local: PenilaianKompositDTO = {
        id: `local-${Date.now()}`, jenis: "Kanker", ringkasan, data,
        pemeriksa: perawat, tanggal: NOTE_DATE_FMT.format(new Date()), waktu: new Date().toISOString(),
      };
      setHistory((h) => [kompositToNote(local), ...h]);
      reset();
      toast.info("Pasien demo — penilaian tidak tersimpan ke database");
      return;
    }
    try {
      setSaving(true);
      const dto = await createPenilaianKomposit(kunjunganId, payload);
      setHistory((h) => [kompositToNote(dto), ...h]);
      reset();
      toast.success("Penilaian kanker tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan penilaian kanker", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const chip = (active: boolean, scheme: "sky" | "rose") => {
    const on = {
      sky: "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200",
      rose: "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    };
    return cn(
      "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
      active ? on[scheme] : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
    );
  };

  const tnmBtn = (active: boolean) => cn(
    "rounded-md border px-2 py-0.5 font-mono text-xs font-bold transition-all",
    active ? "border-sky-500 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
  );

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-5">
          {/* Literasi Tumor */}
          <div>
            <SectionHead icon={Microscope} title="Literasi Tumor" iconCls="text-sky-400" />
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Jenis / Nama Tumor</Label>
                  <input value={form.jenisTumor} onChange={(e) => set("jenisTumor", e.target.value)} placeholder="Ca. Mammae, Ca. Paru..." className={inputCls} />
                </div>
                <div>
                  <Label>Lokasi Primer</Label>
                  <input value={form.lokasiPrimer} onChange={(e) => set("lokasiPrimer", e.target.value)} placeholder="Payudara kiri, paru kanan..." className={inputCls} />
                </div>
              </div>
              <div>
                <Label>Histologi / Morfologi</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HISTOLOGI_OPTS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setHistologi((a) => toggleItem(a, opt))} className={chip(histologi.includes(opt), "sky")}>{opt}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Lateralitas</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LATERALITAS_OPTS.map((opt) => (
                    <button key={opt} type="button" onClick={() => set("lateralitas", form.lateralitas === opt ? "" : opt)} className={chip(form.lateralitas === opt, "sky")}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TNM (vocab bespoke — bukan skala) */}
          <div>
            <SectionHead icon={Microscope} title="TNM Klinis" subtitle="AJCC/UICC — staging lookup site-specific (vocab)" iconCls="text-sky-400" />
            {tnmDisplay && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5">
                <span className="text-[11px] font-semibold text-sky-500">TNM:</span>
                <span className="font-mono text-xs font-bold text-sky-800">{tnmDisplay}</span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {([
                ["T — Tumor Primer", "tStage", T_OPTS],
                ["N — KGB Regional", "nStage", N_OPTS],
                ["M — Metastasis Jauh", "mStage", M_OPTS],
              ] as [string, keyof typeof form, string[]][]).map(([label, key, opts]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <div className="flex flex-wrap gap-1">
                    {opts.map((opt) => (
                      <button key={opt} type="button" onClick={() => set(key, form[key] === opt ? "" : opt)} className={tnmBtn(form[key] === opt)}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Klasifikasi (master): ECOG · Grade · Stadium */}
          <div>
            <SectionHead icon={Microscope} title="Klasifikasi & Staging" subtitle="ECOG · Grade · Stadium — dari Master Skala Penyakit" iconCls="text-sky-400" />
            {instruments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-4 text-center text-xs text-slate-500">
                Belum ada klasifikasi onkologi ter-assign unit <span className="font-semibold">{modul}</span>. Assign di Master → Skala Penyakit.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {instruments.map((ins) => (
                  <ScaleField key={ins.kode} instrument={ins} scores={scaleScores[ins.kode] ?? {}}
                    onScore={(itemId, score) => onScore(ins.kode, itemId, score)} />
                ))}
              </div>
            )}
          </div>

          {/* Metastasis & kesimpulan */}
          <div>
            <SectionHead icon={Microscope} title="Metastasis & Kesimpulan" iconCls="text-sky-400" />
            <div className="flex flex-col gap-3">
              <div>
                <Label>Lokasi Metastasis</Label>
                <div className="flex flex-wrap gap-1.5">
                  {METASTASIS_LOKASI.map((opt) => (
                    <button key={opt} type="button" onClick={() => setMetastasisLokasi((a) => toggleItem(a, opt))} className={chip(metastasisLokasi.includes(opt), "rose")}>{opt}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Perluasan Tumor & Status Metastasis</Label>
                <AutoTextarea value={form.perluasan} onChange={(v) => set("perluasan", v)} placeholder="Ukuran, ekstensi lokal, infiltrasi, status metastasis berdasarkan pencitraan..." minRows={2} />
              </div>
              <div>
                <Label>Kesimpulan / Rencana Onkologi</Label>
                <AutoTextarea value={form.kesimpulan} onChange={(v) => set("kesimpulan", v)} placeholder="Kesimpulan staging & rencana terapi (operasi/kemo/radiasi/paliatif)..." minRows={2} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <SaveBtn label="Simpan Penilaian Kanker" onClick={handleSave} disabled={isEmpty} loading={saving} />
          </div>
        </div>
      }
      history={<HistoryPanel title="Onkologi" notes={history} />}
    />
  );
}
