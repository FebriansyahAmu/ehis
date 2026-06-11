"use client";

// IGD TTV tab — wrapper yang mewiring TTVTab shared ke domain Observation (DB).
// Pasien DB (id = UUID) → fetch time-series saat mount + simpan via recordObservasi.
// Pasien demo (mock) → teruskan data mock, tanpa onSave (perilaku in-memory shared).

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import TTVTabShared, { type TTVSavePayload } from "@/components/shared/medical-records/TTVTab";
import type { IGDPatientDetail, RITTVRecord, RIShift } from "@/lib/data";
import { listObservasi, recordObservasi } from "@/lib/api/observation";
import type { ObservationDTO } from "@/lib/schemas/observation";
import { useSession } from "@/contexts/SessionContext";
import { emitRecordChange } from "@/lib/realtime/recordBus";

// id kunjungan DB = UUID; id demo/mock ("igd-1") tak tersimpan ke DB.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Turunkan shift dari jam "HH:mm" (mirror timeToShift FE) bila DTO.shift null.
function shiftFromJam(jam: string): RIShift {
  const h = Number(jam.slice(0, 2));
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Siang";
  return "Malam";
}

function dtoToRecord(d: ObservationDTO): RITTVRecord {
  return {
    id: d.id,
    tanggal: d.tanggal,
    jam: d.jam,
    shift: d.shift ?? shiftFromJam(d.jam),
    perawat: d.perawat,
    vitalSigns: { ...d.vitalSigns },
    statusKesadaran: d.statusKesadaran,
  };
}

// Tanggal lokal "YYYY-MM-DD" (untuk merakit waktuObservasi dari jam observasi IGD).
function localDate(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export default function TTVTab({ patient }: { patient: IGDPatientDetail }) {
  const { session } = useSession();
  const isPersisted = UUID_RE.test(patient.id);
  const [history, setHistory] = useState<RITTVRecord[] | null>(
    isPersisted ? null : (patient.ttvHistory ?? []),
  );
  const [loading, setLoading] = useState(isPersisted);

  // Muat time-series TTV dari DB (kunjungan nyata). Mock → pakai patient.ttvHistory.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const list = await listObservasi(patient.id, ac.signal);
        if (ac.signal.aborted) return;
        setHistory(list.map(dtoToRecord));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setHistory([]); // gagal muat → kosong (form tetap bisa dipakai; DB tetap sumber)
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [patient.id, isPersisted]);

  if (loading || history === null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
        <Loader2 size={13} className="animate-spin" /> Memuat observasi TTV dari rekam medis…
      </div>
    );
  }

  const latest = history[0];

  // Mode DB → simpan observasi; kembalikan record terpersist ke shared utk state lokal.
  const handleSave = isPersisted
    ? async (p: TTVSavePayload): Promise<RITTVRecord> => {
        const dto = await recordObservasi(patient.id, {
          ...p.vitalSigns,
          statusKesadaran: p.statusKesadaran,
          // IGD: shift diturunkan backend dari jam (akurat); RI/RJ: kirim shift terpilih.
          shift: p.isIGDMode ? undefined : p.shift,
          perawat: p.perawat,
          waktuObservasi: p.isIGDMode && p.jam ? `${localDate()}T${p.jam}` : undefined,
        });
        // Beri tahu komponen lain (PatientHeader vitals bar) → update tanpa refresh.
        emitRecordChange(patient.id, "observation");
        return dtoToRecord(dto);
      }
    : undefined;

  return (
    <TTVTabShared
      vitalSigns={latest?.vitalSigns ?? patient.vitalSigns}
      statusKesadaran={latest?.statusKesadaran ?? patient.statusKesadaran}
      history={history}
      triage={patient.triage}
      onSave={handleSave}
      recordedBy={session?.namaTampil}
    />
  );
}
