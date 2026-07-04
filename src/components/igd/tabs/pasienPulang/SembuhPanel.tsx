"use client";

import { useEffect, useState } from "react";
import { Home, Activity, Pill, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { listResep } from "@/lib/api/resep/resep";
import { type PulangPatient, Field, SectionHeader, textareaCls } from "./pasienPulangShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  status: "Sembuh" | "Membaik";
  patient: PulangPatient;
  /** Emit isi form → parent sertakan ke disposisi saat complete. */
  onChange?: (data: { instruksi: string; obatPulang: string }) => void;
}

interface ObatPulangRow {
  nama: string;
  detail: string; // "3×1 · 10 pcs · 5 hari"
  isHAM: boolean;
}

export default function SembuhPanel({ status, patient, onChange }: Props) {
  const [instruksi, setInstruksi]     = useState("");
  const [obatPulang, setObatPulang]   = useState("");
  // Order obat pulang NYATA (resep ber-flag isObatPulang, non-batal) — null = belum termuat.
  const [obatRows, setObatRows]       = useState<ObatPulangRow[] | null>(null);

  const isPersisted = UUID_RE.test(patient.id);

  // onChange = setter stabil dari parent → emit saat field berubah (tanpa loop).
  useEffect(() => { onChange?.({ instruksi, obatPulang }); }, [instruksi, obatPulang, onChange]);

  // Tarik obat pulang dari order resep DB → daftar hijau + auto-isi teks disposisi
  // (snapshot Disposisi.obatPulang). Tanpa order → fallback isian manual.
  useEffect(() => {
    if (!isPersisted) return; // demo: obatRows tetap null → isian manual tanpa hint
    const ac = new AbortController();
    listResep(patient.id, ac.signal)
      .then((orders) => {
        const rows: ObatPulangRow[] = [];
        for (const o of orders) {
          if (!o.isObatPulang || o.status === "Dibatalkan") continue;
          for (const it of o.items) {
            const detail = [
              it.signa || it.dosisSekali || it.dosis,
              it.jumlah > 0 ? `${it.jumlah} pcs` : "",
              it.durasiHari > 0 ? `${it.durasiHari} hari` : "",
            ].filter(Boolean).join(" · ");
            rows.push({ nama: it.namaObat, detail, isHAM: it.isHAM });
          }
        }
        setObatRows(rows);
        if (rows.length > 0) {
          setObatPulang(rows.map((r) => `${r.nama}${r.detail ? ` — ${r.detail}` : ""}`).join("\n"));
        }
      })
      .catch(() => setObatRows([]));
    return () => ac.abort();
  }, [isPersisted, patient.id]);

  const isSembuh = status === "Sembuh";
  const accent = isSembuh
    ? { border: "border-emerald-200", bg: "bg-emerald-50/60", text: "text-emerald-700" }
    : { border: "border-teal-200",    bg: "bg-teal-50/60",    text: "text-teal-700"    };

  const hasOrders = (obatRows?.length ?? 0) > 0;

  return (
    <div className={cn("overflow-hidden rounded-xl border shadow-sm", accent.border)}>
      <SectionHeader
        icon={isSembuh ? Home : Activity}
        title={isSembuh ? "Informasi Pulang Sembuh" : "Informasi Pulang Membaik"}
      />
      <div className="flex flex-col gap-4 p-4">
        <Field label="Instruksi Pulang & Edukasi Pasien" required>
          <textarea
            value={instruksi}
            onChange={(e) => setInstruksi(e.target.value)}
            rows={4}
            placeholder="Istirahat cukup, hindari aktivitas berat selama 2 minggu. Minum obat sesuai anjuran, jangan hentikan sendiri. Segera kembali jika timbul sesak napas, nyeri dada berulang, atau kelemahan mendadak..."
            className={textareaCls}
          />
        </Field>

        {/* Obat yang dibawa pulang — AUTO dari order Obat Pulang (Farmasi) bila ada. */}
        {hasOrders ? (
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <p className="text-[11px] font-semibold text-slate-600">Obat yang Dibawa Pulang</p>
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                Auto · Order Obat Pulang
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="divide-y divide-emerald-100">
                {obatRows!.map((r, i) => (
                  <div key={`${r.nama}-${i}`} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <Pill size={11} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-emerald-900">{r.nama}</p>
                      {r.detail && <p className="text-[10px] text-emerald-600">{r.detail}</p>}
                    </div>
                    {r.isHAM && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold text-red-700">
                        <AlertTriangle size={8} /> HAM
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="border-t border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-[9.5px] text-emerald-600">
                Ditarik dari order resep ber-flag <span className="font-semibold">Obat Pulang</span> (sub
                Obat &amp; Jadwal) · ikut tersimpan pada disposisi pemulangan.
              </p>
            </div>
          </div>
        ) : (
          <Field label="Obat yang Dibawa Pulang">
            <textarea
              value={obatPulang}
              onChange={(e) => setObatPulang(e.target.value)}
              rows={3}
              placeholder="Aspirin 80mg 1×1, Atorvastatin 20mg 1×1 malam, Bisoprolol 2.5mg 1×1 pagi, Ramipril 5mg 1×1..."
              className={textareaCls}
            />
            {isPersisted && obatRows !== null && (
              <p className="mt-1 text-[10px] text-amber-600">
                Belum ada order Obat Pulang ke Farmasi — buat di sub Obat &amp; Jadwal, atau isi manual.
              </p>
            )}
          </Field>
        )}

        <div className={cn("rounded-xl border px-3 py-2.5", accent.bg, accent.border)}>
          <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-widest", accent.text)}>
            Ringkasan
          </p>
          <p className={cn("text-[11px]", accent.text)}>
            <span className="font-semibold">{patient.name}</span> ({patient.noRM}) diizinkan pulang
            dengan kondisi <span className="font-bold">{status}</span>. DPJP:{" "}
            <span className="font-medium">{patient.doctor}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
