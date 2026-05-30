"use client";

// ANT-ONSITE — Step Lama: cari rekam (NIK / No. RM) lalu konfirmasi identitas.

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, IdCard, UserX, CheckCircle2, UserPlus, CalendarDays } from "lucide-react";
import { findPatient } from "@/lib/registration/registrationStore";
import type { PatientMaster } from "@/lib/data";
import { KioskButton, KioskField, kioskInputClass } from "../apmUi";
import { KioskInput } from "../keyboard/KioskInput";

type Phase = "search" | "notfound" | "confirm";

export function StepCariPasien({
  onFound,
  onSwitchToBaru,
}: {
  onFound: (p: PatientMaster) => void;
  onSwitchToBaru: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tglLahir, setTglLahir] = useState("");
  const [phase, setPhase] = useState<Phase>("search");
  const [found, setFound] = useState<PatientMaster | null>(null);

  const handleSearch = () => {
    const p = findPatient(query);
    if (p) {
      setFound(p);
      setPhase("confirm");
    } else {
      setPhase("notfound");
    }
  };

  const reset = () => {
    setPhase("search");
    setFound(null);
  };

  // ── Konfirmasi identitas ───────────────────────────────
  if (phase === "confirm" && found) {
    return (
      <div className="flex flex-col items-center gap-8 pt-4">
        <Heading
          title="Konfirmasi Identitas"
          subtitle="Pastikan data berikut adalah benar milik Anda."
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200"
        >
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-600">
              {found.name.charAt(0)}
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-800">{found.name}</p>
              <p className="text-sm text-slate-500">
                {found.gender === "L" ? "Laki-laki" : "Perempuan"} · {found.age} tahun
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <Detail label="No. Rekam Medis" value={found.noRM} />
            <Detail label="NIK" value={found.nik} />
            <Detail label="Tanggal Lahir" value={found.tanggalLahir} />
            <Detail label="No. HP" value={found.noHp || "-"} />
          </dl>
        </motion.div>
        <div className="flex w-full max-w-lg gap-4">
          <KioskButton variant="secondary" full onClick={reset}>
            Bukan Saya
          </KioskButton>
          <KioskButton variant="primary" full icon={CheckCircle2} onClick={() => onFound(found)}>
            Ya, Benar
          </KioskButton>
        </div>
      </div>
    );
  }

  // ── Tidak ditemukan ────────────────────────────────────
  if (phase === "notfound") {
    return (
      <div className="flex flex-col items-center gap-8 pt-10">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
          <UserX className="h-10 w-10" aria-hidden />
        </span>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800">Data Tidak Ditemukan</h2>
          <p className="mt-2 max-w-md text-lg text-slate-500">
            Kami tidak menemukan rekam medis dengan{" "}
            <span className="font-semibold text-slate-700">&ldquo;{query}&rdquo;</span>. Periksa
            kembali atau daftar sebagai pasien baru.
          </p>
        </div>
        <div className="flex w-full max-w-lg gap-4">
          <KioskButton variant="secondary" full onClick={reset}>
            Coba Lagi
          </KioskButton>
          <KioskButton variant="primary" full icon={UserPlus} onClick={onSwitchToBaru}>
            Daftar Pasien Baru
          </KioskButton>
        </div>
      </div>
    );
  }

  // ── Form cari ──────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-8 pt-4">
      <Heading
        title="Cari Data Pasien"
        subtitle="Masukkan NIK / No. Rekam Medis dan tanggal lahir Anda."
      />
      <div className="flex w-full max-w-lg flex-col gap-5">
        <KioskField label="NIK atau No. Rekam Medis">
          <KioskInput
            value={query}
            onChange={setQuery}
            layout="text"
            placeholder="Contoh: RM-2025-005 / 3171…"
            autoFocus
            leftIcon={<IdCard className="h-6 w-6" aria-hidden />}
          />
        </KioskField>

        <KioskField label="Tanggal Lahir" hint="(verifikasi)">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-300" aria-hidden />
            <input
              type="date"
              value={tglLahir}
              onChange={(e) => setTglLahir(e.target.value)}
              className={kioskInputClass}
              style={{ paddingLeft: "3.25rem" }}
            />
          </div>
        </KioskField>

        <KioskButton
          variant="primary"
          full
          icon={Search}
          disabled={!query.trim()}
          onClick={handleSearch}
          className="mt-2"
        >
          Cari Data
        </KioskButton>
      </div>
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">{title}</h2>
      <p className="mt-2 text-lg text-slate-500">{subtitle}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-700">{value}</dd>
    </div>
  );
}
