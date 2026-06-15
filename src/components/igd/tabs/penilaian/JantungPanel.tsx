"use client";

// Penilaian Jantung — asesmen KOMPOSIT: narasi + vocab bespoke + klasifikasi baku (Killip/NYHA/TIMI)
// yang DIKOMPOSISI dari master Skala Penyakit (kategori "Penyakit"). Klasifikasi dirender via
// <ScaleField> (definisi current dari master); hasil + narasi disimpan sebagai snapshot ke
// medicalrecord.penilaian_komposit (jenis "Jantung", append-only). Skoring = single source master.

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
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

// Klasifikasi kardiologi dikenali dari nama instrumen master (kode auto SP-NNNN → match by nama).
const CARDIO_MATCH = /killip|nyha|timi/i;

const FAKTOR_RISIKO_OPTS = ["Hipertensi", "Diabetes Melitus", "Dislipidemia", "Merokok", "Obesitas", "Riwayat Keluarga", "Gagal Ginjal Kronik", "Sindrom Metabolik"];
const EKG_OPTS = ["Normal Sinus Ritme", "ST Elevasi", "ST Depresi", "T Inversi", "LBBB", "RBBB", "Atrial Fibrilasi", "VT / VF", "Blok AV", "LVH"];

const EMPTY = { background: "", keluhan: "", troponin: "", ckmb: "", bnp: "", temuanPerawatan: "", komplikasi: "", tatalaksana: "", kesimpulan: "" };

function kompositToNote(d: PenilaianKompositDTO): NoteEntry {
  const lines: string[] = [];
  if (d.ringkasan) lines.push(d.ringkasan);
  const skala = Array.isArray(d.data?.skala) ? (d.data.skala as Array<Record<string, unknown>>) : [];
  skala.forEach((s) => lines.push(`• ${s.skalaNama}: ${s.totalSkor}${s.interpretasiLabel ? ` — ${s.interpretasiLabel}` : ""}`));
  return { date: d.tanggal, author: d.pemeriksa || "—", content: lines.join("\n") || "(tanpa ringkasan)", tag: "Jantung" };
}

export default function JantungPanel({ kunjunganId, isPersisted, perawat, modul }: PanelCtx) {
  const [form, setForm] = useState(EMPTY);
  const [faktorRisiko, setFaktorRisiko] = useState<string[]>([]);
  const [ekg, setEkg] = useState<string[]>([]);
  const [scaleScores, setScaleScores] = useState<Record<string, ScaleScores>>({});
  const [instruments, setInstruments] = useState<ScaleInstrument[]>([]);
  const [history, setHistory] = useState<NoteEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Klasifikasi kardiologi dari master (kategori Penyakit, ter-assign unit).
  useEffect(() => {
    const ac = new AbortController();
    listSkalaTersedia({ modul, kategori: "Penyakit" }, ac.signal)
      .then((rows) => setInstruments(rows.filter((r) => CARDIO_MATCH.test(r.nama))))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat klasifikasi jantung", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [modul]);

  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenilaianKomposit(kunjunganId, "Jantung", ac.signal)
      .then((rows) => setHistory(rows.map(kompositToNote)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat penilaian jantung", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const onScore = (kode: string, itemId: string, score: number) =>
    setScaleScores((p) => ({ ...p, [kode]: { ...(p[kode] ?? {}), [itemId]: score } }));

  const isEmpty = useMemo(() => {
    const anyText = Object.values(form).some((v) => v.trim()) || faktorRisiko.length > 0 || ekg.length > 0;
    const anyScale = instruments.some((ins) => computeScale(ins, scaleScores[ins.kode] ?? {}).allFilled);
    return !anyText && !anyScale;
  }, [form, faktorRisiko, ekg, instruments, scaleScores]);

  function reset() {
    setForm(EMPTY); setFaktorRisiko([]); setEkg([]); setScaleScores({});
  }

  function buildData() {
    const skala = instruments
      .map((ins) => ({ ins, r: computeScale(ins, scaleScores[ins.kode] ?? {}) }))
      .filter((x) => x.r.allFilled)
      .map(({ ins, r }) => ({
        skalaKode: ins.kode, skalaNama: ins.nama, totalSkor: r.total, totalMax: ins.totalMax,
        interpretasiLabel: r.interp?.label ?? "", interpretasiTone: r.interp?.tone ?? "", jawaban: r.jawaban,
      }));
    return { ...form, faktorRisiko, ekg, skala };
  }

  async function handleSave() {
    if (isEmpty || saving) return;
    const data = buildData();
    const payload = { jenis: "Jantung" as const, ringkasan: form.kesimpulan || undefined, data };
    if (!isPersisted) {
      const local: PenilaianKompositDTO = {
        id: `local-${Date.now()}`, jenis: "Jantung", ringkasan: form.kesimpulan, data,
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
      toast.success("Penilaian jantung tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan penilaian jantung", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const tagPill = (active: boolean, scheme: "rose" | "sky") => cn(
    "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
    active
      ? scheme === "rose"
        ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-200"
        : "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200"
      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
  );

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-5">
          {/* Background */}
          <div>
            <SectionHead icon={Heart} title="Background" subtitle="Riwayat & faktor risiko kardiovaskular" iconCls="text-rose-400" />
            <div className="flex flex-col gap-3">
              <div>
                <Label>Riwayat Penyakit Jantung</Label>
                <AutoTextarea value={form.background} onChange={(v) => set("background", v)}
                  placeholder="Riwayat CAD, CHF, aritmia, prosedur kardiovaskular (PCI, CABG, alat)..." minRows={3} />
              </div>
              <div>
                <Label>Faktor Risiko Kardiovaskular</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FAKTOR_RISIKO_OPTS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setFaktorRisiko((a) => toggleItem(a, opt))} className={tagPill(faktorRisiko.includes(opt), "rose")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Finding */}
          <div>
            <SectionHead icon={Heart} title="Temuan Saat Masuk" subtitle="Anamnesis, biomarker, EKG" iconCls="text-rose-400" />
            <div className="flex flex-col gap-3">
              <div>
                <Label>Keluhan Utama & Anamnesis</Label>
                <AutoTextarea value={form.keluhan} onChange={(v) => set("keluhan", v)}
                  placeholder="Keluhan utama, onset, karakter, faktor pencetus & pereda, gejala penyerta..." minRows={3} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  ["Troponin I / T", "troponin", "ng/L"],
                  ["CK-MB", "ckmb", "IU/L"],
                  ["BNP / NT-proBNP", "bnp", "pg/mL"],
                ] as [string, keyof typeof form, string][]).map(([label, key, ph]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputCls} />
                  </div>
                ))}
              </div>
              <div>
                <Label>Temuan EKG</Label>
                <div className="flex flex-wrap gap-1.5">
                  {EKG_OPTS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setEkg((a) => toggleItem(a, opt))} className={tagPill(ekg.includes(opt), "sky")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Klasifikasi (master) */}
          <div>
            <SectionHead icon={Heart} title="Klasifikasi & Skoring" subtitle="Killip · NYHA · TIMI — dari Master Skala Penyakit" iconCls="text-rose-400" />
            {instruments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-4 text-center text-[11px] text-slate-500">
                Belum ada klasifikasi kardiologi ter-assign unit <span className="font-semibold">{modul}</span>. Assign di Master → Skala Penyakit.
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

          {/* Perkembangan */}
          <div>
            <SectionHead icon={Heart} title="Perkembangan & Tatalaksana" iconCls="text-rose-400" />
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Komplikasi</Label>
                  <AutoTextarea value={form.komplikasi} onChange={(v) => set("komplikasi", v)} placeholder="Komplikasi selama perawatan..." minRows={2} />
                </div>
                <div>
                  <Label>Tatalaksana Utama</Label>
                  <AutoTextarea value={form.tatalaksana} onChange={(v) => set("tatalaksana", v)} placeholder="Intervensi, prosedur, obat utama..." minRows={2} />
                </div>
              </div>
              <div>
                <Label>Kesimpulan Klinis Jantung</Label>
                <AutoTextarea value={form.kesimpulan} onChange={(v) => set("kesimpulan", v)} placeholder="Kesimpulan kardiovaskular & rekomendasi tatalaksana..." minRows={2} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <SaveBtn label="Simpan Penilaian Jantung" onClick={handleSave} disabled={isEmpty} loading={saving} />
          </div>
        </div>
      }
      history={<HistoryPanel title="Kardiovaskular" notes={history} />}
    />
  );
}
