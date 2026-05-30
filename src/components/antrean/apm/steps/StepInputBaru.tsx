"use client";

// ANT-ONSITE — Step Baru: input data minimal pasien baru + dedup NIK.
// Data lengkap dilengkapi di loket admisi (T2/T3).

import { useState } from "react";
import { motion } from "framer-motion";
import { IdCard, User, MapPin, CalendarDays, Phone, ArrowRight, AlertTriangle, UserCheck } from "lucide-react";
import { findPatientByNik } from "@/lib/registration/registrationStore";
import type { PatientMaster } from "@/lib/data";
import { KioskButton, KioskField, kioskInputClass } from "../apmUi";
import { KioskInput } from "../keyboard/KioskInput";

export interface InputBaruValue {
  nik: string;
  nama: string;
  tempatLahir: string;
  tglLahir: string; // ISO yyyy-mm-dd
  noHp: string;
}

const FIELD_PAD = { paddingLeft: "3.25rem" } as const;

export function StepInputBaru({
  onProceedNew,
  onProceedExisting,
}: {
  onProceedNew: (value: InputBaruValue) => void;
  onProceedExisting: (p: PatientMaster) => void;
}) {
  const [v, setV] = useState<InputBaruValue>({
    nik: "",
    nama: "",
    tempatLahir: "",
    tglLahir: "",
    noHp: "",
  });
  const [duplicate, setDuplicate] = useState<PatientMaster | null>(null);

  const set = (k: keyof InputBaruValue) => (val: string) =>
    setV((prev) => ({ ...prev, [k]: val }));

  const nikValid = /^\d{16}$/.test(v.nik);
  const valid = nikValid && v.nama.trim() && v.tempatLahir.trim() && v.tglLahir && v.noHp.trim();

  const handleSubmit = () => {
    if (!valid) return;
    const existing = findPatientByNik(v.nik);
    if (existing) {
      setDuplicate(existing);
      return;
    }
    onProceedNew(v);
  };

  // ── Interstitial dedup NIK ─────────────────────────────
  if (duplicate) {
    return (
      <div className="flex flex-col items-center gap-8 pt-8">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
          <AlertTriangle className="h-10 w-10" aria-hidden />
        </span>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800">NIK Sudah Terdaftar</h2>
          <p className="mt-2 max-w-md text-lg text-slate-500">
            NIK ini sudah memiliki rekam medis atas nama{" "}
            <span className="font-semibold text-slate-700">{duplicate.name}</span>. Anda akan
            dilanjutkan sebagai <span className="font-semibold text-indigo-600">Pasien Lama</span>.
          </p>
        </div>
        <div className="flex w-full max-w-lg gap-4">
          <KioskButton variant="secondary" full onClick={() => setDuplicate(null)}>
            Perbaiki NIK
          </KioskButton>
          <KioskButton variant="primary" full icon={UserCheck} onClick={() => onProceedExisting(duplicate)}>
            Lanjutkan
          </KioskButton>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-7 pt-2">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Data Pasien Baru</h2>
        <p className="mt-2 text-lg text-slate-500">
          Isi data berikut. Data lengkap akan dilengkapi petugas di loket admisi.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-2xl gap-5 sm:grid-cols-2"
      >
        <KioskField label="NIK (16 digit)" className="sm:col-span-2">
          <KioskInput
            value={v.nik}
            onChange={set("nik")}
            layout="numeric"
            inputMode="numeric"
            maxLength={16}
            placeholder="3171xxxxxxxxxxxx"
            autoFocus
            leftIcon={<IdCard className="h-6 w-6" aria-hidden />}
          />
          {v.nik.length > 0 && !nikValid && (
            <span className="text-xs font-medium text-rose-500">NIK harus 16 digit angka.</span>
          )}
        </KioskField>

        <KioskField label="Nama Lengkap" className="sm:col-span-2">
          <KioskInput
            value={v.nama}
            onChange={set("nama")}
            layout="text"
            placeholder="Sesuai KTP"
            leftIcon={<User className="h-6 w-6" aria-hidden />}
          />
        </KioskField>

        <KioskField label="Tempat Lahir">
          <KioskInput
            value={v.tempatLahir}
            onChange={set("tempatLahir")}
            layout="text"
            placeholder="Kota kelahiran"
            leftIcon={<MapPin className="h-6 w-6" aria-hidden />}
          />
        </KioskField>

        <KioskField label="Tanggal Lahir">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-300" aria-hidden />
            <input
              type="date"
              value={v.tglLahir}
              onChange={(e) => set("tglLahir")(e.target.value)}
              className={kioskInputClass}
              style={FIELD_PAD}
            />
          </div>
        </KioskField>

        <KioskField label="No. Handphone" className="sm:col-span-2">
          <KioskInput
            value={v.noHp}
            onChange={set("noHp")}
            layout="numeric"
            inputMode="tel"
            maxLength={14}
            placeholder="08xxxxxxxxxx"
            leftIcon={<Phone className="h-6 w-6" aria-hidden />}
          />
        </KioskField>
      </motion.div>

      <KioskButton
        variant="primary"
        icon={ArrowRight}
        disabled={!valid}
        onClick={handleSubmit}
        className="w-full max-w-2xl"
      >
        Lanjutkan
      </KioskButton>
    </div>
  );
}
