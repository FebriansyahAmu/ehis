"use client";

import { useEffect, useState } from "react";
import { Building2, Stethoscope, Loader2, AlertCircle, UserX, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs";
import { listRuanganByType } from "@/lib/api/ruangan";
import { listDokter, type DokterListItemDTO } from "@/lib/api/dokter";
import { listPaketLayananTersedia, type PaketDTO } from "@/lib/api/master/paketLayanan";
import type { LocationNode } from "@/components/master/ruangan/ruanganShared";
import { POLI_OPTS } from "../../config";
import { inputCls, labelCls, type KunjunganForm } from "./config";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const fmtRp = (v: number): string =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

/**
 * Detail Rawat Jalan pada wizard pendaftaran: Poli Tujuan (master Location locationType=Rawat_Jalan)
 * + Dokter Penanggung Jawab = dokter yang DITUGASKAN ke poli tsb (master.PenugasanRuangan).
 * Pilih poli → fetch dokter ter-assign → pilih dokter → set form.dpjpId (persist Kunjungan.dpjpId).
 * `form.poli` menyimpan NAMA poli (kontrak `kunjungan.poli`); `form.poliRuanganId` id lokasi (transient).
 *
 * Fallback: bila master belum punya ruangan Poli (kosong/gagal), kembali ke daftar poli statis +
 * DPJP teks-bebas (perilaku lama) agar pendaftaran RJ tak terblokir.
 */
export function StepKunjunganRj({
  form, setForm,
}: {
  form: KunjunganForm;
  setForm: React.Dispatch<React.SetStateAction<KunjunganForm>>;
}) {
  // ── Poli (master Location locationType=Rawat_Jalan) ──
  const [poliList, setPoliList] = useState<LocationNode[]>([]);
  const [poliLoading, setPoliLoading] = useState(true);
  const [poliError, setPoliError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    setPoliLoading(true);
    setPoliError(false);
    listRuanganByType("Rawat_Jalan", ctrl.signal)
      .then((rows) => {
        if (cancelled) return;
        setPoliList(rows);
        // Resolusi poliRuanganId dari nama default (mis. "Poli Umum") → dokter langsung termuat.
        if (!form.poliRuanganId && form.poli) {
          const match = rows.find((r) => r.name === form.poli);
          if (match) setForm((f) => ({ ...f, poliRuanganId: match.id }));
        }
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setPoliError(true); })
      .finally(() => { if (!cancelled) setPoliLoading(false); });
    return () => { cancelled = true; ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dokter ter-assign ke poli terpilih ──
  const [dokter, setDokter] = useState<DokterListItemDTO[]>([]);
  const [dokterLoading, setDokterLoading] = useState(false);

  useEffect(() => {
    if (!form.poliRuanganId) { setDokter([]); return; }
    const ctrl = new AbortController();
    let cancelled = false;
    setDokterLoading(true);
    listDokter({ locationId: form.poliRuanganId, status: "Aktif", limit: 50 }, ctrl.signal)
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
  }, [form.poliRuanganId, setForm]);

  // ── Paket Layanan (master.PaketLayanan, opsional) ──
  const [pakets, setPakets] = useState<PaketDTO[] | null>(null);
  const [showPaket, setShowPaket] = useState<boolean>(!!form.paketId);
  useEffect(() => {
    const ctrl = new AbortController();
    listPaketLayananTersedia(ctrl.signal)
      .then(setPakets)
      .catch((e) => { if (!isAbort(e)) setPakets([]); });
    return () => ctrl.abort();
  }, []);
  const togglePaket = (on: boolean) => {
    setShowPaket(on);
    if (!on) setForm((f) => ({ ...f, paketId: undefined }));
  };
  const pickPaket = (id: string) =>
    setForm((f) => ({ ...f, paketId: f.paketId === id ? undefined : id }));

  const onPickPoli = (id: string) => {
    const r = poliList.find((x) => x.id === id);
    // Ganti poli → reset DPJP (daftar dokter berubah). Simpan nama poli untuk kontrak kunjungan.poli.
    setForm((f) => ({ ...f, poliRuanganId: id, poli: r?.name ?? f.poli, dpjpId: "", dpjpNama: "" }));
  };
  const onPickDokter = (id: string) => {
    const d = dokter.find((x) => x.id === id);
    setForm((f) => ({ ...f, dpjpId: id, dpjpNama: d?.namaTampil ?? "" }));
  };

  // Master belum punya ruangan Poli → daftar statis + DPJP teks-bebas (legacy).
  const useFallback = !poliLoading && (poliError || poliList.length === 0);

  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail Rawat Jalan</p>

      {/* Poli Tujuan */}
      <div>
        <label className={labelCls}>Poli Tujuan</label>
        {poliLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Memuat poli…
          </div>
        ) : useFallback ? (
          <Select
            value={form.poli}
            onChange={(v) => setForm((f) => ({ ...f, poli: v }))}
            options={POLI_OPTS.map((p) => ({ value: p, label: p }))}
            icon={Building2}
          />
        ) : (
          <Select
            value={form.poliRuanganId}
            onChange={onPickPoli}
            options={poliList.map((r) => ({ value: r.id, label: `${r.name} · ${r.kode}` }))}
            icon={Building2}
            placeholder="Pilih poli tujuan…"
          />
        )}
        {poliError && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
            <AlertCircle size={10} /> Gagal memuat poli master — memakai daftar bawaan.
          </p>
        )}
      </div>

      {/* Dokter Penanggung Jawab — dokter ter-assign ke poli terpilih */}
      <div>
        <label className={labelCls}>Dokter Penanggung Jawab</label>
        {useFallback ? (
          <input
            type="text"
            value={form.dokter}
            onChange={(e) => setForm((f) => ({ ...f, dokter: e.target.value }))}
            placeholder="dr. Nama Dokter, Sp.X"
            className={inputCls}
          />
        ) : !form.poliRuanganId ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-400">
            Pilih poli tujuan dulu untuk melihat dokter yang bertugas.
          </div>
        ) : dokterLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Memuat dokter poli…
          </div>
        ) : dokter.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
            <UserX size={13} className="mt-px shrink-0" />
            <span>Belum ada dokter ditugaskan ke poli ini. Atur di Master → Mapping Hub → SDM Assignment.</span>
          </div>
        ) : (
          <>
            <Select
              value={form.dpjpId}
              onChange={onPickDokter}
              options={dokter.map((d) => ({ value: d.id, label: `${d.namaTampil} — ${d.spesialisLabel}` }))}
              icon={Stethoscope}
              placeholder="Pilih dokter poli…"
            />
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <Stethoscope size={10} /> {dokter.length} dokter bertugas di poli ini
            </p>
          </>
        )}
      </div>

      {/* Paket Layanan (opsional) — hanya Rawat Jalan */}
      <div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 transition hover:bg-slate-50">
          <input
            type="checkbox"
            checked={showPaket}
            onChange={(e) => togglePaket(e.target.checked)}
            className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-sky-500"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-slate-700">Sertakan Paket Layanan</p>
            <p className="text-[10px] leading-tight text-slate-400">Paket bundling (MCU, dll.) — ditagihkan sebagai satu paket.</p>
          </div>
          <Package size={15} className={showPaket ? "text-sky-500" : "text-slate-300"} />
        </label>

        {showPaket && (
          <div className="mt-2 space-y-1.5">
            {pakets === null ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                <Loader2 size={13} className="animate-spin" /> Memuat paket layanan…
              </div>
            ) : pakets.length === 0 ? (
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-[11px] text-slate-400">
                <Package size={13} className="mt-px shrink-0" />
                <span>Belum ada paket aktif di master. Atur di Master → Paket Layanan.</span>
              </div>
            ) : (
              pakets.map((p) => {
                const selected = form.paketId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPaket(p.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition active:scale-[0.99]",
                      selected ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200" : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                      selected ? "border-sky-500 bg-sky-500" : "border-slate-300",
                    )}>
                      {selected && <Check size={11} className="text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-slate-700">{p.nama}</p>
                      <p className="text-[10px] text-slate-400">{p.kategori} · {p.items.length} item</p>
                    </div>
                    <span className="shrink-0 text-[12px] font-bold text-sky-600">{fmtRp(p.hargaUmum)}</span>
                  </button>
                );
              })
            )}
            {pakets && pakets.length > 0 && (
              <p className="text-[9.5px] leading-tight text-slate-400">
                Harga umum ditampilkan; tarif final mengikuti penjamin & muncul otomatis di tagihan (ehis-billing).
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
