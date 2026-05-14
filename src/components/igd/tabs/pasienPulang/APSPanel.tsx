"use client";

import { useState } from "react";
import { ShieldAlert, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, SectionHeader, inputCls, textareaCls } from "./pasienPulangShared";

interface Props {
  onConfirmedChange: (v: boolean) => void;
}

export default function APSPanel({ onConfirmedChange }: Props) {
  const [alasan, setAlasan]             = useState("");
  const [edukasi, setEdukasi]           = useState("");
  const [penandatangan, setPenandatangan] = useState("");
  const [hubungan, setHubungan]         = useState("");
  const [saksi, setSaksi]               = useState("");
  const [confirmed, setConfirmed]       = useState(false);

  const toggle = () => {
    const next = !confirmed;
    setConfirmed(next);
    onConfirmedChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 shadow-sm">
      <SectionHeader icon={ShieldAlert} title="Formulir Pernyataan APS" badge="Wajib" />
      <div className="flex flex-col gap-4 p-4">

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[11px] text-amber-700">
            Pasien / keluarga menyatakan keinginan pulang meskipun belum diizinkan secara medis.
            Seluruh risiko telah dijelaskan dan dipahami. Dokumentasikan dengan lengkap.
          </p>
        </div>

        <Field label="Alasan Pulang APS" required>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={2}
            placeholder="Alasan pasien / keluarga meminta pulang..."
            className={textareaCls}
          />
        </Field>

        <Field label="Edukasi Risiko yang Telah Diberikan" required>
          <textarea
            value={edukasi}
            onChange={(e) => setEdukasi(e.target.value)}
            rows={3}
            placeholder="Jelaskan risiko medis yang telah dikomunikasikan: risiko perburukan kondisi, komplikasi yang mungkin terjadi, tanda bahaya yang harus diwaspadai..."
            className={textareaCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Penandatangan" required>
            <input
              value={penandatangan}
              onChange={(e) => setPenandatangan(e.target.value)}
              placeholder="Nama pasien / keluarga"
              className={inputCls}
            />
          </Field>
          <Field label="Hubungan dengan Pasien">
            <input
              value={hubungan}
              onChange={(e) => setHubungan(e.target.value)}
              placeholder="Pasien sendiri / Suami / Istri / Anak..."
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Nama Saksi">
          <input
            value={saksi}
            onChange={(e) => setSaksi(e.target.value)}
            placeholder="Nama perawat / dokter jaga sebagai saksi"
            className={inputCls}
          />
        </Field>

        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
            confirmed
              ? "border-amber-400 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-slate-600 hover:border-amber-300",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
              confirmed ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 bg-white",
            )}
          >
            {confirmed && <Check size={10} />}
          </span>
          <p className="text-xs leading-relaxed">
            Saya menyatakan bahwa pasien / keluarga telah memahami dan menerima semua risiko dari
            keputusan pulang atas permintaan sendiri, serta telah menandatangani surat pernyataan APS.
          </p>
        </button>
      </div>
    </div>
  );
}
