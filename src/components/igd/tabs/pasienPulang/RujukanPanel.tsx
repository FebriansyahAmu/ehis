"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, SectionHeader, inputCls, textareaCls } from "./pasienPulangShared";

export default function RujukanPanel() {
  const [noSurat, setNoSurat]           = useState("");
  const [rsName, setRsName]             = useState("");
  const [bagianTujuan, setBagianTujuan] = useState("");
  const [alasan, setAlasan]             = useState("");
  const [stable, setStable]             = useState<boolean | null>(null);
  const [transport, setTransport]       = useState("");
  const [pendamping, setPendamping]     = useState("");

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 shadow-sm">
      <SectionHeader icon={Send} title="Surat Rujukan Eksternal" />
      <div className="flex flex-col gap-4 p-4">
        <Field label="Nomor Surat Rujukan">
          <input
            value={noSurat}
            onChange={(e) => setNoSurat(e.target.value)}
            placeholder="Contoh: RUJ/2026/05/0023"
            className={inputCls}
          />
        </Field>

        <Field label="Rumah Sakit / Fasilitas Tujuan" required>
          <input
            value={rsName}
            onChange={(e) => setRsName(e.target.value)}
            placeholder="Nama RS atau faskes tujuan"
            className={inputCls}
          />
        </Field>

        <Field label="Bagian / Spesialis Tujuan" required>
          <input
            value={bagianTujuan}
            onChange={(e) => setBagianTujuan(e.target.value)}
            placeholder="Contoh: Poli Jantung, ICU, Bedah Syaraf..."
            className={inputCls}
          />
        </Field>

        <Field label="Alasan Klinis Rujukan" required>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            placeholder="Jelaskan alasan klinis merujuk pasien, fasilitas yang dibutuhkan dan tidak tersedia di RS ini..."
            className={textareaCls}
          />
        </Field>

        <Field label="Kondisi Pasien Saat Dirujuk">
          <div className="flex gap-2">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setStable(val)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-xs font-medium transition",
                  stable === val
                    ? val
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                {val ? "Stabil" : "Tidak Stabil"}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Transportasi">
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className={inputCls}
            >
              <option value="">Pilih...</option>
              <option>Ambulans RS</option>
              <option>Ambulans Swasta</option>
              <option>Kendaraan Pribadi</option>
            </select>
          </Field>
          <Field label="Nakes Pendamping">
            <input
              value={pendamping}
              onChange={(e) => setPendamping(e.target.value)}
              placeholder="Nama dokter / perawat"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5">
          <p className="text-[11px] text-sky-700">
            Pastikan RS tujuan telah dikonfirmasi dan siap menerima sebelum proses transfer.
            Sertakan copy rekam medis dan hasil pemeriksaan penunjang.
          </p>
        </div>
      </div>
    </div>
  );
}
