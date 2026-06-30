"use client";

// Asesmen Risiko (generik, master-driven) — sub-menu tab Penilaian. Menggantikan panel
// hardcode Morse/Braden/Barthel: instrumen ditarik dari master `master.SkalaInstrument`
// (ter-assign unit via konsumenModul), dirender generik (items×opsi + skor + interpretasi),
// lalu disimpan sebagai snapshot ke medicalrecord.penilaian_skala (append-only).
// Skoring dihitung di sini (single source = definisi master). Selaras pola panel lain.

import { useEffect, useMemo, useState } from "react";
import { Gauge, Search, BookOpen, ArrowDownWideNarrow } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  TwoPanel, HistoryPanel, Label, Pill, ScoreBar, SaveBtn, AutoTextarea, NOTE_DATE_FMT,
  type NoteEntry, type PanelCtx,
} from "./shared";
import {
  listSkalaTersedia, getPenilaianSkala, createPenilaianSkala,
  type SkalaTersediaDTO, type PenilaianSkalaDTO,
} from "@/lib/api/penilaian/penilaianSkala";

// Tone master (emerald/yellow/amber/orange/rose/red/sky) → kelas badge + bar (purge-safe).
const TONE_MAP: Record<string, { cls: string; barCls: string }> = {
  emerald: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" },
  yellow:  { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",    barCls: "bg-yellow-500"  },
  amber:   { cls: "bg-amber-50 text-amber-700 border-amber-200",       barCls: "bg-amber-500"   },
  orange:  { cls: "bg-orange-50 text-orange-700 border-orange-200",     barCls: "bg-orange-500"  },
  rose:    { cls: "bg-rose-50 text-rose-700 border-rose-200",          barCls: "bg-rose-500"    },
  red:     { cls: "bg-red-50 text-red-700 border-red-300",             barCls: "bg-red-600"     },
  sky:     { cls: "bg-sky-50 text-sky-700 border-sky-200",             barCls: "bg-sky-500"     },
};

// DTO riwayat → NoteEntry (ringkas: skor + interpretasi + catatan).
function skalaToNote(d: PenilaianSkalaDTO): NoteEntry {
  const lines = [`${d.skalaNama}: ${d.totalSkor}/${d.totalMax}${d.interpretasiLabel ? ` — ${d.interpretasiLabel}` : ""}`];
  if (d.catatan) lines.push(d.catatan);
  return { date: d.tanggal, author: d.pemeriksa || "—", content: lines.join("\n"), tag: d.skalaKode };
}

export default function SkalaRisikoPanel({ kunjunganId, isPersisted, perawat, modul }: PanelCtx) {
  const [instruments, setInstruments] = useState<SkalaTersediaDTO[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedKode, setSelectedKode] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [catatan, setCatatan] = useState("");
  const [history, setHistory] = useState<NoteEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Muat katalog instrumen master ter-assign unit (selalu — independen kunjungan).
  useEffect(() => {
    const ac = new AbortController();
    setLoadingList(true);
    listSkalaTersedia({ modul, kategori: "Risiko" }, ac.signal)
      .then((rows) => setInstruments(rows))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat daftar skala", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setLoadingList(false));
    return () => ac.abort();
  }, [modul]);

  // Muat riwayat hasil (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenilaianSkala(kunjunganId, ac.signal)
      .then((rows) => setHistory(rows.map(skalaToNote)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat asesmen risiko", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const selected = useMemo(
    () => instruments.find((i) => i.kode === selectedKode) ?? null,
    [instruments, selectedKode],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return instruments;
    return instruments.filter((i) =>
      i.nama.toLowerCase().includes(q) || i.singkat.toLowerCase().includes(q) || i.kode.toLowerCase().includes(q),
    );
  }, [instruments, query]);

  // Skoring (single source = definisi master).
  const { total, allFilled, interp } = useMemo(() => {
    if (!selected) return { total: 0, allFilled: false, interp: null as SkalaTersediaDTO["interpretasi"][number] | null };
    const items = selected.items;
    const filled = items.length > 0 && items.every((it) => scores[it.id] != null);
    const sum = items.reduce((s, it) => s + (scores[it.id] ?? 0), 0);
    const found = filled ? selected.interpretasi.find((r) => sum >= r.min && sum <= r.max) ?? null : null;
    return { total: sum, allFilled: filled, interp: found };
  }, [selected, scores]);

  const level = interp ? { label: interp.label, ...(TONE_MAP[interp.tone] ?? TONE_MAP.sky) } : null;

  function pickInstrument(kode: string) {
    setSelectedKode(kode);
    setScores({});
    setCatatan("");
  }

  async function handleSave() {
    if (!selected || !allFilled || saving) return;
    const jawaban = selected.items.map((it) => {
      const sc = scores[it.id];
      const opt = it.options.find((o) => o.score === sc);
      return { itemId: it.id, itemLabel: it.label, score: sc ?? 0, optionLabel: opt?.label ?? "" };
    });
    const payload = {
      skalaKode: selected.kode,
      skalaNama: selected.nama,
      kategori: "Risiko",
      totalSkor: total,
      totalMax: selected.totalMax,
      interpretasiLabel: interp?.label ?? "",
      interpretasiTone: interp?.tone ?? "",
      jawaban,
      catatan: catatan || undefined,
    };

    if (!isPersisted) {
      const local: PenilaianSkalaDTO = {
        id: `local-${Date.now()}`, ...payload, catatan: catatan,
        interpretasiLabel: interp?.label ?? "", interpretasiTone: interp?.tone ?? "",
        jawaban, pemeriksa: perawat, tanggal: NOTE_DATE_FMT.format(new Date()), waktu: new Date().toISOString(),
      };
      setHistory((h) => [skalaToNote(local), ...h]);
      pickInstrument(selected.kode);
      toast.info("Pasien demo — asesmen tidak tersimpan ke database");
      return;
    }
    try {
      setSaving(true);
      const dto = await createPenilaianSkala(kunjunganId, payload);
      setHistory((h) => [skalaToNote(dto), ...h]);
      pickInstrument(selected.kode);
      toast.success("Asesmen risiko tersimpan", `${dto.skalaNama} · ${dto.totalSkor}/${dto.totalMax}`);
    } catch (e) {
      toast.error("Gagal menyimpan asesmen risiko", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3.5">
          {/* Instrument selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Pilih Skala Penilaian</Label>
              <span className="text-[11px] text-slate-400">{instruments.length} skala tersedia · unit {modul}</span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari skala (Morse, Barthel, nyeri, gizi…)"
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {loadingList ? (
              <p className="py-6 text-center text-xs text-slate-400">Memuat daftar skala…</p>
            ) : instruments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500">
                Belum ada skala ter-assign untuk unit <span className="font-semibold">{modul}</span>.
                <br />Assign di <span className="font-semibold text-slate-600">Master → Skala Risiko</span> (kolom Konsumen Modul).
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {filtered.map((ins) => {
                  const active = ins.kode === selectedKode;
                  return (
                    <button
                      key={ins.kode}
                      type="button"
                      onClick={() => pickInstrument(ins.kode)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-all",
                        active
                          ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200"
                          : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/30",
                      )}
                    >
                      <span className={cn("text-xs font-semibold", active ? "text-sky-700" : "text-slate-700")}>{ins.nama}</span>
                      {ins.singkat && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{ins.singkat}</span>
                      )}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="col-span-full py-3 text-center text-xs text-slate-400">Tidak ada skala cocok “{query}”.</p>
                )}
              </div>
            )}
          </div>

          {/* Selected instrument form */}
          {selected && (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700">{selected.nama}</p>
                  {selected.deskripsi && <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{selected.deskripsi}</p>}
                </div>
                {selected.arah === "lower_is_worse" && (
                  <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                    <ArrowDownWideNarrow size={10} /> Skor rendah = risiko tinggi
                  </span>
                )}
              </div>

              {selected.items.map((item) => (
                <div key={item.id}>
                  <Label>{item.label}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {item.options.map((opt) => (
                      <Pill
                        key={`${item.id}-${opt.score}-${opt.label}`}
                        label={opt.detail ? `${opt.label} · ${opt.detail}` : opt.label}
                        score={opt.score}
                        selected={scores[item.id] === opt.score}
                        onClick={() => setScores((p) => ({ ...p, [item.id]: opt.score }))}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <ScoreBar total={total} max={selected.totalMax} allFilled={allFilled} level={level} />

              {interp?.action && (
                <div className={cn("rounded-lg border px-3 py-2 text-xs leading-snug", level?.cls)}>
                  <span className="font-semibold">Tindak lanjut:</span> {interp.action}
                </div>
              )}

              <div>
                <Label>Catatan (opsional)</Label>
                <AutoTextarea value={catatan} onChange={setCatatan} placeholder="Catatan tambahan, konteks asesmen…" minRows={2} />
              </div>

              {selected.referensi && (
                <p className="flex items-center gap-1 text-[11px] text-slate-400">
                  <BookOpen size={10} /> {selected.referensi}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {allFilled ? "Semua item terisi" : "Lengkapi semua item untuk menyimpan"}
                </span>
                <SaveBtn label="Simpan Asesmen" onClick={handleSave} disabled={!allFilled} loading={saving} />
              </div>
            </div>
          )}

          {!selected && !loadingList && instruments.length > 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
              <Gauge size={20} className="text-slate-300" />
              <p className="text-xs text-slate-400">Pilih skala di atas untuk mulai menilai</p>
            </div>
          )}
        </div>
      }
      history={<HistoryPanel title="Asesmen Risiko" notes={history} />}
    />
  );
}
