import TTVTabShared from "@/components/shared/medical-records/TTVTab";
import type { RawatInapPatientDetail } from "@/lib/data";

export default function TTVTab({ patient }: { patient: RawatInapPatientDetail }) {
  return (
    <TTVTabShared
      vitalSigns={patient.vitalSigns}
      statusKesadaran={patient.statusKesadaran}
      history={patient.ttvHistory}
    />
  );
}
