"use client";

import { useState } from "react";
import { Phone, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { ModalShell } from "../primitives";

type KontakSection = "kontak" | "pj";

const SECTIONS: {
  id: KontakSection;
  label: string;
  icon: typeof Phone;
  desc: string;
  iconBg: string;
  iconText: string;
}[] = [
  {
    id: "kontak",
    label: "Kontak Pasien",
    icon: Phone,
    desc: "No. HP dan email",
    iconBg: "bg-sky-100",
    iconText: "text-sky-600",
  },
  {
    id: "pj",
    label: "Penanggung Jawab",
    icon: UserCheck,
    desc: "Kontak darurat keluarga",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
  },
];

export function EditKontakModal({
  patient,
  onClose,
  onSave,
}: {
  patient: PatientMaster;
  onClose: () => void;
  onSave: (p: PatientMaster) => void;
}) {
  const [d, setD] = useState({ ...patient.kontakDarurat });
  const [hp, setHp] = useState(patient.noHp);
  const [em, setEm] = useState(patient.email ?? "");
  const [activeSection, setActiveSection] = useState<KontakSection>("kontak");

  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const sectionIdx = SECTIONS.findIndex((s) => s.id === activeSection);

  function InputField({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
    );
  }

  return (
    <ModalShell
      title="Edit Kontak & Penanggung Jawab"
      subtitle="Informasi kontak dan kontak darurat pasien"
      onClose={onClose}
      size="lg"
    >
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 380 }}>
        {/* Left sidebar */}
        <div className="flex w-48 shrink-0 flex-col border-r border-slate-100 bg-slate-50/80">
          <div className="flex flex-col items-center gap-2 border-b border-slate-100 px-4 py-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-base font-black shadow-sm ring-4 ring-white",
                patient.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
              )}
            >
              {initials}
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold leading-tight text-slate-800">
                {patient.name.split(" ").slice(0, 2).join(" ")}
              </p>
              <p className="mt-0.5 font-mono text-[9px] text-slate-400">{patient.noRM}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {SECTIONS.map((s) => {
              const SIcon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-xl p-3 text-left transition-all duration-150",
                    isActive
                      ? "bg-indigo-600 shadow-sm shadow-indigo-200 text-white"
                      : "text-slate-500 hover:bg-white hover:shadow-xs",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg mt-0.5 transition",
                      isActive ? "bg-white/20" : s.iconBg,
                    )}
                  >
                    <SIcon size={12} className={isActive ? "text-white" : s.iconText} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-[11px] font-bold leading-tight", isActive ? "text-white" : "text-slate-700")}>
                      {s.label}
                    </p>
                    <p className={cn("mt-0.5 text-[10px] leading-tight", isActive ? "text-white/60" : "text-slate-400")}>
                      {s.desc}
                    </p>
                  </div>
                  {isActive && <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center justify-center gap-1.5 px-4 pb-5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all duration-200",
                  activeSection === s.id ? "w-5 bg-indigo-500" : "w-1.5 bg-slate-300 hover:bg-slate-400",
                )}
              />
            ))}
            <span className="ml-1 text-[10px] text-slate-400">{sectionIdx + 1}/{SECTIONS.length}</span>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === "kontak" && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100">
                  <Phone size={13} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Kontak Pasien</p>
                  <p className="text-[10px] text-slate-400">No. HP aktif dan alamat email</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <InputField label="No. HP Pasien" value={hp} onChange={setHp} />
                <InputField label="Email Pasien" value={em} onChange={setEm} />
              </div>
            </div>
          )}

          {activeSection === "pj" && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
                  <UserCheck size={13} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Penanggung Jawab</p>
                  <p className="text-[10px] text-slate-400">Kontak darurat keluarga / kerabat</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <InputField label="Nama" value={d.nama ?? ""} onChange={(v) => setD((x) => ({ ...x, nama: v }))} />
                <InputField label="Hubungan" value={d.hubungan ?? ""} onChange={(v) => setD((x) => ({ ...x, hubungan: v }))} />
                <InputField label="No. HP" value={d.noHp ?? ""} onChange={(v) => setD((x) => ({ ...x, noHp: v }))} />
                <InputField label="Alamat" value={d.alamat ?? ""} onChange={(v) => setD((x) => ({ ...x, alamat: v }))} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <button
            disabled={sectionIdx === 0}
            onClick={() => setActiveSection(SECTIONS[sectionIdx - 1].id)}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-30"
          >
            ← Sebelumnya
          </button>
          <button
            disabled={sectionIdx === SECTIONS.length - 1}
            onClick={() => setActiveSection(SECTIONS[sectionIdx + 1].id)}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-30"
          >
            Selanjutnya →
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onSave({ ...patient, noHp: hp, email: em, kontakDarurat: d });
              onClose();
            }}
            className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
