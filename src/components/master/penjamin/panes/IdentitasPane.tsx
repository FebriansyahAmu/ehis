"use client";

import { IdCard, Phone, Mail, MapPin, User as UserIcon } from "lucide-react";
import type { PenjaminRecord, PenjaminTipe, StatusPenjamin } from "@/lib/master/penjaminStore";
import { TIPE_CFG, STATUS_CFG, TIPE_LIST, STATUS_LIST } from "../penjaminShared";
import { Field, TextInput, SectionGroup } from "./FormPrimitives";

interface Props {
  draft: PenjaminRecord;
  onPatch: (p: Partial<PenjaminRecord>) => void;
}

export default function IdentitasPane({ draft, onPatch }: Props) {
  const patchKontak = (p: Partial<PenjaminRecord["kontak"]>) =>
    onPatch({ kontak: { ...draft.kontak, ...p } });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">

      {/* ── Identitas Dasar ───────────────────────────────── */}
      <SectionGroup
        title="Identitas Dasar"
        icon={IdCard}
        accent={{ bg: "bg-emerald-50", text: "text-emerald-600" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kode Penjamin" required hint="3-6 huruf">
            <TextInput
              value={draft.kode}
              onChange={(v) => onPatch({ kode: v.toUpperCase() })}
              placeholder="BPJS"
              maxLength={6}
              mono
            />
          </Field>
          <Field label="Tipe Penjamin" required>
            <div className="flex flex-wrap gap-1">
              {TIPE_LIST.map((t) => {
                const cfg = TIPE_CFG[t];
                const active = draft.tipe === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onPatch({ tipe: t as PenjaminTipe })}
                    className={
                      active
                        ? `rounded-lg border border-transparent px-2.5 py-1.5 text-[11px] font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`
                        : "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    }
                  >
                    {cfg.short}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Nama Penjamin" required className="col-span-2">
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="BPJS Kesehatan / Allianz Life / dst."
            />
          </Field>

          <Field label="Status" className="col-span-2">
            <div className="flex flex-wrap gap-1">
              {STATUS_LIST.map((s) => {
                const cfg = STATUS_CFG[s];
                const active = draft.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onPatch({ status: s as StatusPenjamin })}
                    className={
                      active
                        ? `flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[11px] font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`
                        : "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    }
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </SectionGroup>

      {/* ── Kontak PIC ────────────────────────────────────── */}
      <SectionGroup
        title="Kontak / PIC"
        icon={UserIcon}
        accent={{ bg: "bg-sky-50", text: "text-sky-600" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama PIC" className="col-span-2">
            <TextInput
              value={draft.kontak.picNama}
              onChange={(v) => patchKontak({ picNama: v })}
              placeholder="Nama lengkap PIC"
            />
          </Field>
          <Field label="Jabatan">
            <TextInput
              value={draft.kontak.picJabatan ?? ""}
              onChange={(v) => patchKontak({ picJabatan: v || undefined })}
              placeholder="Provider Officer"
            />
          </Field>
          <Field label="Telepon">
            <div className="relative">
              <Phone size={11} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput
                value={draft.kontak.picTelp}
                onChange={(v) => patchKontak({ picTelp: v })}
                placeholder="021-xxxxxxx"
                className="pl-8"
              />
            </div>
          </Field>
          <Field label="Email" className="col-span-2">
            <div className="relative">
              <Mail size={11} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput
                type="email"
                value={draft.kontak.picEmail}
                onChange={(v) => patchKontak({ picEmail: v })}
                placeholder="provider@asuransi.co.id"
                className="pl-8"
              />
            </div>
          </Field>
          <Field label="Alamat Kantor" className="col-span-2">
            <div className="relative">
              <MapPin size={11} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
              <TextInput
                value={draft.kontak.alamatKantor}
                onChange={(v) => patchKontak({ alamatKantor: v })}
                placeholder="Jl. Sudirman Kav. ..."
                className="pl-8"
              />
            </div>
          </Field>
          <Field label="Kota / Kabupaten" className="col-span-2">
            <TextInput
              value={draft.kontak.kota}
              onChange={(v) => patchKontak({ kota: v })}
              placeholder="Jakarta Selatan"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* ── Catatan (full width) ──────────────────────────── */}
      <div className="lg:col-span-2">
        <Field label="Catatan Internal" hint="opsional">
          <textarea
            value={draft.catatan ?? ""}
            onChange={(e) => onPatch({ catatan: e.target.value || undefined })}
            placeholder="Catatan administrasi internal — tidak ditampilkan ke pasien."
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </Field>
      </div>

    </div>
  );
}
