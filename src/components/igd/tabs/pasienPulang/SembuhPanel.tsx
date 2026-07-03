"use client";

import { useEffect, useState } from "react";
import { Home, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PulangPatient, Field, SectionHeader, textareaCls } from "./pasienPulangShared";

interface Props {
  status: "Sembuh" | "Membaik";
  patient: PulangPatient;
  /** Emit isi form → parent sertakan ke disposisi saat complete. */
  onChange?: (data: { instruksi: string; obatPulang: string }) => void;
}

export default function SembuhPanel({ status, patient, onChange }: Props) {
  const [instruksi, setInstruksi]     = useState("");
  const [obatPulang, setObatPulang]   = useState("");

  // onChange = setter stabil dari parent → emit saat field berubah (tanpa loop).
  useEffect(() => { onChange?.({ instruksi, obatPulang }); }, [instruksi, obatPulang, onChange]);

  const isSembuh = status === "Sembuh";
  const accent = isSembuh
    ? { border: "border-emerald-200", bg: "bg-emerald-50/60", text: "text-emerald-700" }
    : { border: "border-teal-200",    bg: "bg-teal-50/60",    text: "text-teal-700"    };

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

        <Field label="Obat yang Dibawa Pulang">
          <textarea
            value={obatPulang}
            onChange={(e) => setObatPulang(e.target.value)}
            rows={3}
            placeholder="Aspirin 80mg 1×1, Atorvastatin 20mg 1×1 malam, Bisoprolol 2.5mg 1×1 pagi, Ramipril 5mg 1×1..."
            className={textareaCls}
          />
        </Field>

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
