import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { KunjunganDetailHeader } from "./kunjungan/KunjunganDetailHeader";
import KunjunganTabs from "./kunjungan/KunjunganTabs";

interface Props {
  patient: PatientMaster;
  kunjungan: KunjunganRecord;
}

export default function KunjunganDetailPage({ patient, kunjungan }: Props) {
  const icdCodes = kunjungan.kodeICD?.split(",").map(c => c.trim()).filter(Boolean) ?? [];

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <KunjunganDetailHeader patient={patient} kunjungan={kunjungan} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <KunjunganTabs kunjungan={kunjungan} icdCodes={icdCodes} />
      </div>
    </div>
  );
}
