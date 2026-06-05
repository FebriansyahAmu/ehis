"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCog, Save, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CFG, SPESIALIS_LABEL, dtoToEditForm, namaInitials,
  type DokterDTO, type DokterEditForm, type SpesialisKode,
} from "./dokterShared";
import { ApiError } from "@/lib/api/client";
import { updateDokter, deleteDokter, type UpdateDokterInput } from "@/lib/api/dokter";
import { toast } from "@/lib/ui/toastStore";
import MappingSourceBadge from "../shared/MappingSourceBadge";
import ConfirmDialog from "../ruangan/ConfirmDialog";
import ProfilLisensiTab from "./sections/ProfilLisensiTab";

interface DokterDetailProps {
  dokter: DokterDTO;
  onSaved: (next: DokterDTO) => void;
  onDeleted: (id: string) => void;
}

/** "" → undefined (skip patch; tak menulis "" ke kolom unique STR/SIP). */
const txt = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);
/** "" → null (kosongkan tanggal nullable); else ISO string. */
const datePatch = (v: string): string | null => (v ? v : null);

export default function DokterDetail({ dokter, onSaved, onDeleted }: DokterDetailProps) {
  const [form, setForm] = useState<DokterEditForm>(() => dtoToEditForm(dokter));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setForm(dtoToEditForm(dokter));
    setDirty(false);
  }, [dokter]);

  const onField = <K extends keyof DokterEditForm>(key: K, value: DokterEditForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  // Ganti spesialis → auto-isi kualifikasi (cermin server) selama belum di-override.
  const onSpesialis = (s: SpesialisKode) => {
    setForm((f) => ({
      ...f,
      spesialisKode: s,
      kualifikasi: !f.kualifikasi || f.kualifikasi === SPESIALIS_LABEL[f.spesialisKode]
        ? SPESIALIS_LABEL[s]
        : f.kualifikasi,
    }));
    setDirty(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    const input: UpdateDokterInput = {
      expectedVersion: dokter.version,
      spesialisKode: form.spesialisKode,
      statusPraktik: form.statusPraktik,
      kualifikasi: txt(form.kualifikasi),
      noStr: txt(form.noStr),
      noSip: txt(form.noSip),
      ihsPractitionerId: txt(form.ihsPractitionerId),
      strBerlakuHingga: datePatch(form.strBerlakuHingga),
      sipBerlakuHingga: datePatch(form.sipBerlakuHingga),
    };
    try {
      const updated = await updateDokter(dokter.id, input);
      onSaved(updated);
      setDirty(false);
      toast.success("Profil tersimpan", updated.namaTampil);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan perubahan";
      if (err instanceof ApiError && err.code === "CONFLICT_VERSION") {
        toast.error("Data berubah di tempat lain", "Muat ulang lalu coba lagi.");
      } else {
        toast.error("Gagal menyimpan", msg);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDokter(dokter.id, dokter.version);
      toast.success("Profil dihapus", dokter.namaTampil);
      setConfirmOpen(false);
      onDeleted(dokter.id);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus profil";
      toast.error("Gagal menghapus", msg);
      setDeleting(false);
    }
  }

  const status = STATUS_CFG[form.statusPraktik];
  const spesialisLabel = useMemo(() => SPESIALIS_LABEL[form.spesialisKode], [form.spesialisKode]);

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[11px] font-black text-teal-700 ring-2 ring-teal-100">
              {namaInitials(dokter.namaTampil)}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">Dokter / Nakes</p>
              <h2 className="truncate text-sm font-bold text-slate-900">{dokter.namaTampil}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {spesialisLabel}
                </span>
                <span className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  status.bg, status.text,
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={11} />
            Hapus
          </button>
        </div>

        {/* Mapping Hub pointer — Penugasan Poli/Unit dikelola di SDM Assignment */}
        <MappingSourceBadge
          subpage="sdm"
          title="Penugasan Poli & Unit"
          description="Penugasan dokter ke poli, unit klinis, dan ruangan dikelola di Mapping Hub → SDM Assignment. Termasuk masa berlaku tugas dan multi-unit assignment."
          ctaLabel="Atur Penugasan"
        />

        {/* Profil & Lisensi (single pane — jadwal praktik dikelola di Master Jadwal Dokter) */}
        <ProfilLisensiTab
          dokter={dokter}
          form={form}
          onField={onField}
          onSpesialis={onSpesialis}
        />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-[10px] text-slate-400">
            {dirty ? "Perubahan belum disimpan" : "Tidak ada perubahan"}
          </p>
          <button
            type="submit"
            disabled={!dirty || saving}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition outline-none",
              dirty && !saving
                ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-teal-300"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        kindLabel="Profil Dokter"
        name={dokter.namaTampil}
        kode={dokter.nip}
        icon={UserCog}
        busy={deleting}
        message={
          <>
            Profil klinis dokter ini akan dihapus. Data pegawai{" "}
            <span className="font-semibold text-slate-600">tetap ada</span> — hanya kredensial
            klinis (STR/SIP/spesialisasi) yang dilepas.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmOpen(false)}
      />
    </>
  );
}
