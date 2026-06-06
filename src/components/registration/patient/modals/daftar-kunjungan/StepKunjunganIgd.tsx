"use client";

import { useEffect, useState } from "react";
import { Check, DoorOpen, Loader2, AlertCircle, UserX, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs";
import { listRuanganByType } from "@/lib/api/ruangan";
import { listDokter, type DokterListItemDTO } from "@/lib/api/dokter";
import type { LocationNode } from "@/components/master/ruangan/ruanganShared";
import { TRIASE_CFG, labelCls, type KunjunganForm, type TriaseLevel } from "./config";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

/**
 * Detail IGD pada wizard pendaftaran: triase (box landscape) + Ruangan IGD (master) +
 * DPJP ter-assign ruangan (master.PenugasanRuangan). Pilih ruangan → fetch dokter yang
 * ditugaskan ke ruangan tsb; pilih dokter → set form.dpjpId (persist Kunjungan.dpjpId).
 */
export function StepKunjunganIgd({
  form, setForm,
}: {
  form: KunjunganForm;
  setForm: React.Dispatch<React.SetStateAction<KunjunganForm>>;
}) {
  // ── Ruangan IGD (master Location locationType=IGD) ──
  const [ruangan, setRuangan] = useState<LocationNode[]>([]);
  const [ruanganLoading, setRuanganLoading] = useState(true);
  const [ruanganError, setRuanganError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    setRuanganLoading(true);
    setRuanganError(false);
    listRuanganByType("IGD", ctrl.signal)
      .then((rows) => { if (!cancelled) setRuangan(rows); })
      .catch((e) => { if (!cancelled && !isAbort(e)) setRuanganError(true); })
      .finally(() => { if (!cancelled) setRuanganLoading(false); });
    return () => { cancelled = true; ctrl.abort(); };
  }, []);

  // ── Dokter ter-assign ke ruangan terpilih ──
  const [dokter, setDokter] = useState<DokterListItemDTO[]>([]);
  const [dokterLoading, setDokterLoading] = useState(false);

  useEffect(() => {
    if (!form.ruanganId) { setDokter([]); return; }
    const ctrl = new AbortController();
    let cancelled = false;
    setDokterLoading(true);
    listDokter({ locationId: form.ruanganId, status: "Aktif", limit: 50 }, ctrl.signal)
      .then(({ items }) => {
        if (cancelled) return;
        setDokter(items);
        // Auto-pilih bila hanya satu dokter ter-assign (mempercepat loket).
        if (items.length === 1) {
          setForm((f) => ({ ...f, dpjpId: items[0].id, dpjpNama: items[0].namaTampil }));
        }
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setDokter([]); })
      .finally(() => { if (!cancelled) setDokterLoading(false); });
    return () => { cancelled = true; ctrl.abort(); };
  }, [form.ruanganId, setForm]);

  const onPickRuangan = (id: string) => {
    const r = ruangan.find((x) => x.id === id);
    // Ganti ruangan → reset DPJP (daftar dokter berubah).
    setForm((f) => ({ ...f, ruanganId: id, ruanganNama: r?.name ?? "", dpjpId: "", dpjpNama: "" }));
  };
  const onPickDokter = (id: string) => {
    const d = dokter.find((x) => x.id === id);
    setForm((f) => ({ ...f, dpjpId: id, dpjpNama: d?.namaTampil ?? "" }));
  };

  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail IGD</p>

      {/* Level Triase — box landscape (5 kolom, hemat ruang) */}
      <div>
        <label className={labelCls}>Level Triase</label>
        <div className="grid grid-cols-5 gap-1.5">
          {([1, 2, 3, 4, 5] as TriaseLevel[]).map((t) => {
            const cfg = TRIASE_CFG[t];
            const isActive = form.triase === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, triase: t }))}
                aria-pressed={isActive}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition",
                  isActive ? cfg.active : cfg.idle,
                )}
              >
                {isActive && <Check size={11} className="absolute right-1 top-1" />}
                {!isActive && <span className={cn("absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full", cfg.dot)} />}
                <span className="text-[15px] font-black leading-none">{cfg.code}</span>
                <span className="text-[8.5px] font-semibold leading-tight">{cfg.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ruangan IGD */}
      <div>
        <label className={labelCls}>Ruangan IGD</label>
        {ruanganLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Memuat ruangan IGD…
          </div>
        ) : ruanganError ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">
            <AlertCircle size={13} /> Gagal memuat ruangan IGD.
          </div>
        ) : ruangan.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
            <AlertCircle size={13} /> Belum ada ruangan IGD di master Ruangan.
          </div>
        ) : (
          <Select
            value={form.ruanganId}
            onChange={onPickRuangan}
            options={ruangan.map((r) => ({ value: r.id, label: `${r.name} · ${r.kode}` }))}
            icon={DoorOpen}
            placeholder="Pilih ruangan IGD…"
          />
        )}
      </div>

      {/* DPJP — dokter ter-assign ke ruangan terpilih */}
      <div>
        <label className={labelCls}>Dokter Penanggung Jawab (DPJP)</label>
        {!form.ruanganId ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-400">
            Pilih ruangan IGD dulu untuk melihat dokter yang bertugas.
          </div>
        ) : dokterLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Memuat dokter ruangan…
          </div>
        ) : dokter.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
            <UserX size={13} className="mt-px shrink-0" />
            <span>Belum ada dokter ditugaskan ke ruangan ini. Atur di Master → Mapping Hub → SDM Assignment.</span>
          </div>
        ) : (
          <>
            <Select
              value={form.dpjpId}
              onChange={onPickDokter}
              options={dokter.map((d) => ({ value: d.id, label: `${d.namaTampil} — ${d.spesialisLabel}` }))}
              icon={Stethoscope}
              placeholder="Pilih dokter jaga…"
            />
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <Stethoscope size={10} />
              {dokter.length} dokter bertugas di ruangan ini
            </p>
          </>
        )}
      </div>
    </>
  );
}
