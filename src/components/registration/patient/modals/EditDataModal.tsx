"use client";

import { useState } from "react";
import { User, ClipboardList, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { ModalShell } from "../primitives";
import { PENJAMIN_CFG } from "../config";

type SectionId = "identitas" | "info" | "kontak";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: typeof User;
  desc: string;
  iconBg: string;
  iconText: string;
}[] = [
  {
    id: "identitas",
    label: "Identitas Diri",
    icon: User,
    desc: "Nama, NIK, tanggal lahir",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
  },
  {
    id: "info",
    label: "Info Tambahan",
    icon: ClipboardList,
    desc: "Pekerjaan, agama, pendidikan",
    iconBg: "bg-sky-100",
    iconText: "text-sky-600",
  },
  {
    id: "kontak",
    label: "Kontak & Alamat",
    icon: MapPin,
    desc: "HP, email, domisili",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
  },
];

export function EditDataModal({
  patient,
  onClose,
  onSave,
}: {
  patient: PatientMaster;
  onClose: () => void;
  onSave: (p: PatientMaster) => void;
}) {
  const [d, setD] = useState({ ...patient });
  const [activeSection, setActiveSection] = useState<SectionId>("identitas");

  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const pjCfg = PENJAMIN_CFG[patient.penjamin.tipe];
  const sectionIdx = SECTIONS.findIndex((s) => s.id === activeSection);

  function Field({ fld }: {
    fld: { key: keyof PatientMaster; label: string; span?: boolean; type?: string };
  }) {
    return (
      <div className={cn("flex flex-col gap-1.5", fld.span && "col-span-2")}>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {fld.label}
        </label>
        <input
          type={fld.type ?? "text"}
          value={(d[fld.key] ?? "") as string}
          onChange={(e) => setD((x) => ({ ...x, [fld.key]: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
    );
  }

  return (
    <ModalShell
      title="Edit Data Pribadi"
      subtitle="Perubahan akan disimpan ke rekam medis pasien"
      onClose={onClose}
      size="xl"
    >
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 440 }}>
        {/* Left sidebar */}
        <div className="flex w-52 shrink-0 flex-col border-r border-slate-100 bg-slate-50/80">
          <div className="flex flex-col items-center gap-2.5 border-b border-slate-100 px-4 py-5">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full text-lg font-black shadow-sm ring-4 ring-white",
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
              <span className={cn("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold", pjCfg.badge)}>
                {pjCfg.label}
              </span>
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
          {activeSection === "identitas" && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                  <User size={13} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Identitas Diri</p>
                  <p className="text-[10px] text-slate-400">Data identitas utama pasien</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field fld={{ key: "name", label: "Nama Lengkap", span: true }} />
                <Field fld={{ key: "nik", label: "NIK" }} />
                <Field fld={{ key: "tempatLahir", label: "Tempat Lahir" }} />
                <Field fld={{ key: "tanggalLahir", label: "Tanggal Lahir" }} />
                <Field fld={{ key: "agama", label: "Agama" }} />
                <Field fld={{ key: "statusPerkawinan", label: "Status Perkawinan" }} />
              </div>
            </div>
          )}

          {activeSection === "info" && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100">
                  <ClipboardList size={13} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Informasi Tambahan</p>
                  <p className="text-[10px] text-slate-400">Latar belakang sosial pasien</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field fld={{ key: "pekerjaan", label: "Pekerjaan" }} />
                <Field fld={{ key: "pendidikan", label: "Pendidikan" }} />
                <Field fld={{ key: "suku", label: "Suku" }} />
                <Field fld={{ key: "kewarganegaraan", label: "Kewarganegaraan" }} />
              </div>
            </div>
          )}

          {activeSection === "kontak" && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                  <MapPin size={13} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Kontak &amp; Alamat</p>
                  <p className="text-[10px] text-slate-400">Informasi kontak dan domisili</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field fld={{ key: "noHp", label: "No. HP" }} />
                <Field fld={{ key: "email", label: "Email" }} />
                <Field fld={{ key: "alamat", label: "Alamat Lengkap", span: true }} />
                <Field fld={{ key: "kelurahan", label: "Kelurahan" }} />
                <Field fld={{ key: "kecamatan", label: "Kecamatan" }} />
                <Field fld={{ key: "kota", label: "Kota / Kabupaten" }} />
                <Field fld={{ key: "provinsi", label: "Provinsi" }} />
                <Field fld={{ key: "kodePos", label: "Kode Pos" }} />
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
            onClick={() => { onSave(d); onClose(); }}
            className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
