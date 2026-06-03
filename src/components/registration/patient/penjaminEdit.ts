// Sumber tunggal logika "Ubah Penjamin" — dipakai UbahPenjaminModal (dashboard) &
// PenjaminForm (tab Detail Kunjungan). Hindari duplikasi taksonomi + call API (G-K).
// Persist via PATCH /patients/:id/penjamin (patient-level: jaminan aktif/primer pasien).

"use client";

import { useRef, useState } from "react";
import type { PenjaminData, TipePenjamin } from "@/lib/data";
import { updatePenjamin } from "@/lib/api/patients";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { PENJAMIN_CFG } from "./config";

// id pasien DB = UUID; pasien demo/seed = "RM-..." → hanya UUID yang persist ke server.
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Jenis penjamin disederhanakan jadi 3 grup. Subtipe BPJS (PBI/Non-PBI) ditentukan
// dari verifikasi kepesertaan BPJS, bukan pilihan manual.
export type PjGroup = "umum" | "bpjs" | "asuransi";

export const GROUP_OPTS: { group: PjGroup; label: string; desc: string }[] = [
  { group: "umum", label: "Umum / Mandiri", desc: "Bayar sendiri" },
  { group: "bpjs", label: "BPJS / JKN", desc: "Peserta JKN" },
  { group: "asuransi", label: "Asuransi Lainnya", desc: "Asuransi komersial" },
];

export function groupOf(t: TipePenjamin): PjGroup {
  if (t === "BPJS_Non_PBI" || t === "BPJS_PBI") return "bpjs";
  if (t === "Asuransi") return "asuransi";
  return "umum"; // Umum / Jamkesda (legacy) → bucket Umum
}

/** Enum saat grup dipilih — pertahankan subtipe PBI/Non-PBI bila tetap BPJS. */
export function tipeForGroup(g: PjGroup, current: TipePenjamin): TipePenjamin {
  if (g === "umum") return "Umum";
  if (g === "asuransi") return "Asuransi";
  return current === "BPJS_PBI" ? "BPJS_PBI" : "BPJS_Non_PBI";
}

export interface UsePenjaminEditOpts {
  /** Berhasil simpan. `local` diisi utk pasien demo (set state lokal); kosong → refresh server. */
  onSaved: (local?: PenjaminData) => void;
  onClose?: () => void;
}

/** State + persist untuk form ubah penjamin. UI bebas (modal/tab). */
export function usePenjaminEdit(patientId: string, current: PenjaminData, opts: UsePenjaminEditOpts) {
  const isDb = UUID_RE.test(patientId);
  // No. Kartu DB ter-mask → mulai kosong (tak bisa diedit dari nilai masked); demo = prefill.
  const [d, setD] = useState<PenjaminData>(() => ({ ...current, nomor: isDb ? "" : current.nomor }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isBpjs = d.tipe === "BPJS_Non_PBI" || d.tipe === "BPJS_PBI";
  const isAsuransi = d.tipe === "Asuransi";

  function setGroup(g: PjGroup) {
    setD((x) => ({ ...x, tipe: tipeForGroup(g, x.tipe) }));
  }

  async function save() {
    if (!isDb) { opts.onSaved(d); opts.onClose?.(); return; } // pasien demo → state lokal saja
    setSubmitting(true);
    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await updatePenjamin(
        patientId,
        {
          tipe: d.tipe,
          nama: d.nama,
          nomor: d.nomor?.trim() || undefined, // kosong = jangan ubah No. Kartu existing
          kelas: d.kelas,
          noPolis: d.noPolis?.trim() || undefined,
        },
        ac.signal,
      );
      toast.success("Penjamin diperbarui", PENJAMIN_CFG[d.tipe].label);
      opts.onSaved(); // refresh dari server (nomor ter-mask kembali)
      opts.onClose?.();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan penjamin. Coba lagi.";
      setError(msg);
      toast.error("Gagal menyimpan penjamin", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return { d, setD, isDb, isBpjs, isAsuransi, submitting, error, setGroup, save };
}
