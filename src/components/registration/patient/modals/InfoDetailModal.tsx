"use client";

import { Pencil } from "lucide-react";
import type { PatientMaster } from "@/lib/data";
import { ModalShell, InfoRow } from "../primitives";

export function InfoDetailModal({
  patient,
  onClose,
  onEditData,
  onEditKontak,
}: {
  patient: PatientMaster;
  onClose: () => void;
  onEditData: () => void;
  onEditKontak: () => void;
}) {
  return (
    <ModalShell title="Detail Informasi Pasien" subtitle={patient.name} onClose={onClose} size="lg">
      <div className="space-y-5 px-5 py-4 overflow-y-auto max-h-[70vh]">
        {/* Identitas */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Identitas</p>
            <button
              onClick={() => { onClose(); onEditData(); }}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Pencil size={9} /> Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Tempat Lahir" value={patient.tempatLahir} />
            <InfoRow label="Tanggal Lahir" value={patient.tanggalLahir} />
            <InfoRow label="Agama" value={patient.agama} />
            <InfoRow label="Status Perkawinan" value={patient.statusPerkawinan} />
            <InfoRow label="Pekerjaan" value={patient.pekerjaan} />
            <InfoRow label="Pendidikan" value={patient.pendidikan} />
            <InfoRow label="Suku" value={patient.suku} />
            <InfoRow label="Kewarganegaraan" value={patient.kewarganegaraan} />
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Alamat */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Alamat</p>
            <button
              onClick={() => { onClose(); onEditKontak(); }}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Pencil size={9} /> Edit
            </button>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 space-y-0.5">
            <p className="text-xs text-slate-700">{patient.alamat}</p>
            <p className="text-[11px] text-slate-500">Kel. {patient.kelurahan}, Kec. {patient.kecamatan}</p>
            <p className="text-[11px] text-slate-500">{patient.kota}, {patient.provinsi} {patient.kodePos}</p>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Kontak Darurat */}
        <div>
          <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-amber-500">Kontak Darurat</p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-0.5">
            <p className="text-xs font-semibold text-slate-800">{patient.kontakDarurat.nama}</p>
            <p className="text-[11px] text-slate-600">
              {patient.kontakDarurat.hubungan} · {patient.kontakDarurat.noHp}
            </p>
          </div>
        </div>

        {/* Alergi */}
        {patient.alergi && patient.alergi.length > 0 && (
          <>
            <div className="border-t border-slate-100" />
            <div>
              <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-rose-500">Riwayat Alergi</p>
              <div className="flex flex-wrap gap-1.5">
                {patient.alergi.map((a) => (
                  <span key={a} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end border-t border-slate-100 px-5 py-3">
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}
