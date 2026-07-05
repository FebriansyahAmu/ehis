"use client";

// Shell rekam medis Rawat Inap — pemilik state lifecycle "Selesaikan Kunjungan" yang dibagikan
// header (tombol Selesaikan/Batal Selesai) + tab (overlay kunci) + tab Pasien Pulang (form).
// Dua pintu menyelesaikan: (1) tombol kanan-atas → dialog mini-form disposisi; (2) tab Pasien
// Pulang (form lengkap). Kunjungan DB (UUID) persist via transitionKunjungan; pasien demo = lokal.
// Pola identik IGDRecordShell — reuse SelesaikanDialog/BatalSelesaiDialog IGD (generik).

import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Lock } from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { getKunjungan, transitionKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import type { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";
import RIPatientHeader from "./RIPatientHeader";
import RIRecordTabs from "./RIRecordTabs";
import SelesaikanDialog from "@/components/igd/selesai/SelesaikanDialog";
import BatalSelesaiDialog from "@/components/igd/selesai/BatalSelesaiDialog";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Life {
  status: string;
  version: number;
  locked: boolean;
  selesaiAt: string | null;
}

const lifeFrom = (k: KunjunganDTO): Life => ({
  status: k.status,
  version: k.version,
  locked: !!k.lockedAt,
  selesaiAt: k.selesaiAt,
});

export default function RIRecordShell({
  patient,
  initialKunjungan,
}: {
  patient: RawatInapPatientDetail;
  /** Dari resolver (sudah fetch) → hindari fetch ganda. Absen + UUID → self-fetch. */
  initialKunjungan?: KunjunganDTO;
}) {
  const kunjunganId = patient.id;
  const isPersisted = UUID_RE.test(kunjunganId);

  const [life, setLife] = useState<Life>(() =>
    initialKunjungan ? lifeFrom(initialKunjungan) : { status: "InService", version: 0, locked: false, selesaiAt: null },
  );
  const [showSelesai, setShowSelesai] = useState(false);
  const [showBatal, setShowBatal] = useState(false);

  // Self-fetch lifecycle (kunjungan UUID) bila resolver tak memberi.
  useEffect(() => {
    if (!isPersisted || initialKunjungan) return;
    const ac = new AbortController();
    getKunjungan(kunjunganId, ac.signal)
      .then((k) => setLife(lifeFrom(k)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        /* abaikan — fallback demo lifecycle */
      });
    return () => ac.abort();
  }, [isPersisted, initialKunjungan, kunjunganId]);

  // Selesaikan (persist + kunci). Throw saat gagal → pemanggil (form/dialog) tetap terbuka.
  async function handleComplete(disposisi: DisposisiInput, waktuSelesai: string) {
    if (!isPersisted) {
      setLife((l) => ({ ...l, status: "Completed", locked: true, selesaiAt: waktuSelesai }));
      toast.info("Pasien demo — penyelesaian tidak tersimpan ke database");
      return;
    }
    try {
      const k = await transitionKunjungan(kunjunganId, "complete", life.version, { waktuSelesai, disposisi });
      setLife(lifeFrom(k));
      toast.success("Kunjungan diselesaikan", "Rekam medis terkunci — tab Pasien Pulang tetap aktif");
    } catch (e) {
      toast.error("Gagal menyelesaikan kunjungan", e instanceof ApiError ? e.message : undefined);
      throw e;
    }
  }

  // Batal Selesai (buka kunci + simpan alasan). Timestamp selesai dipertahankan.
  async function handleReopen(alasanReopen: string) {
    if (!isPersisted) {
      setLife((l) => ({ ...l, status: "InService", locked: false }));
      toast.info("Pasien demo — perubahan tidak tersimpan");
      return;
    }
    try {
      const k = await transitionKunjungan(kunjunganId, "reopen", life.version, {
        alasanReopen: alasanReopen.trim() || undefined,
      });
      setLife(lifeFrom(k));
      toast.success("Penyelesaian dibatalkan", "Rekam medis dibuka kembali");
    } catch (e) {
      toast.error("Gagal membatalkan penyelesaian", e instanceof ApiError ? e.message : undefined);
      throw e;
    }
  }

  // Aksi header: Batal Selesai (locked) · Selesaikan (InService) · Selesai (badge kunci).
  const headerAction = life.locked ? (
    <button
      type="button"
      onClick={() => setShowBatal(true)}
      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
    >
      <RotateCcw size={12} /> Batal Selesai
    </button>
  ) : life.status === "InService" ? (
    <button
      type="button"
      onClick={() => setShowSelesai(true)}
      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700"
    >
      <CheckCircle2 size={12} /> Selesaikan Kunjungan
    </button>
  ) : life.status === "Completed" ? (
    <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
      <Lock size={12} /> Selesai
    </span>
  ) : null;

  return (
    <div className="flex h-full flex-col">
      <RIPatientHeader patient={patient} headerAction={headerAction} selesaiAt={life.selesaiAt} />
      <RIRecordTabs patient={patient} locked={life.locked} onComplete={handleComplete} />

      {showSelesai && (
        <SelesaikanDialog
          patientName={patient.name}
          onSubmit={handleComplete}
          onClose={() => setShowSelesai(false)}
        />
      )}
      {showBatal && (
        <BatalSelesaiDialog
          selesaiAt={life.selesaiAt}
          onSubmit={handleReopen}
          onClose={() => setShowBatal(false)}
        />
      )}
    </div>
  );
}
