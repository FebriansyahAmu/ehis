"use client";

import { useEffect, useState } from "react";
import { DoorOpen, BedDouble, Loader2, AlertCircle } from "lucide-react";
import { Select } from "@/components/shared/inputs";
import { getTree } from "@/lib/api/ruangan";
import { listActiveBedAllocations } from "@/lib/api/bedAllocation";
import type { LocationNode } from "@/components/master/ruangan/ruanganShared";
import { labelCls, type KunjunganForm } from "./config";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const RI_TYPES = new Set(["Rawat_Inap", "ICU", "HCU", "Isolasi"]);

/**
 * Detail Rawat Inap: pilih ruangan (master Location tipe RI) + bed yang masih TERSEDIA (exclude
 * bed beralokasi aktif). Bed terpilih akan di-RESERVE saat pendaftaran (Kunjungan.bedId).
 */
export function StepKunjunganRi({
  form, setForm,
}: {
  form: KunjunganForm;
  setForm: React.Dispatch<React.SetStateAction<KunjunganForm>>;
}) {
  const [rooms, setRooms] = useState<LocationNode[]>([]);
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([getTree(ctrl.signal), listActiveBedAllocations(undefined, ctrl.signal)])
      .then(([tree, allocs]) => {
        if (cancelled) return;
        const ri = tree.filter(
          (n): n is LocationNode => n.type === "Location" && RI_TYPES.has((n as LocationNode).locationType),
        );
        setRooms(ri);
        setOccupied(new Set(allocs.map((a) => a.bedId)));
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; ctrl.abort(); };
  }, []);

  const room = rooms.find((r) => r.id === form.ruanganId);
  const availableBeds = room ? room.beds.filter((b) => b.status === "active" && !occupied.has(b.id)) : [];

  const onPickRuangan = (id: string) => {
    const r = rooms.find((x) => x.id === id);
    // Ganti ruangan → reset bed terpilih.
    setForm((f) => ({ ...f, ruanganId: id, ruanganNama: r?.name ?? "", bedId: "", bedNama: "" }));
  };
  const onPickBed = (id: string) => {
    const b = availableBeds.find((x) => x.id === id);
    setForm((f) => ({ ...f, bedId: id, bedNama: b?.kode ?? "" }));
  };

  return (
    <>
      {/* Ruangan RI */}
      <div>
        <label className={labelCls}>Ruangan Rawat Inap</label>
        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Memuat ruangan…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">
            <AlertCircle size={13} /> Gagal memuat ruangan rawat inap.
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
            <AlertCircle size={13} /> Belum ada ruangan rawat inap di master.
          </div>
        ) : (
          <Select
            value={form.ruanganId}
            onChange={onPickRuangan}
            options={rooms.map((r) => ({ value: r.id, label: `${r.name} · ${r.kode}` }))}
            icon={DoorOpen}
            placeholder="Pilih ruangan…"
          />
        )}
      </div>

      {/* Bed (reserve) */}
      <div>
        <label className={labelCls}>Bed (di-reserve saat daftar)</label>
        {!form.ruanganId ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-400">
            Pilih ruangan dulu untuk melihat bed yang tersedia.
          </div>
        ) : availableBeds.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
            <BedDouble size={13} className="mt-px shrink-0" />
            <span>Tak ada bed tersedia di {room?.name ?? "ruangan ini"}. Pilih ruangan lain.</span>
          </div>
        ) : (
          <>
            <Select
              value={form.bedId}
              onChange={onPickBed}
              options={availableBeds.map((b) => ({ value: b.id, label: `${b.kode} — ${b.name}` }))}
              icon={BedDouble}
              placeholder="Pilih bed tersedia…"
            />
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <BedDouble size={10} />
              {availableBeds.length} bed tersedia di ruangan ini
            </p>
          </>
        )}
      </div>
    </>
  );
}
