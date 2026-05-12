import TTVTabShared from "@/components/shared/medical-records/TTVTab";
import type { IGDPatientDetail } from "@/lib/data";

export default function TTVTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <TTVTabShared
      vitalSigns={patient.vitalSigns}
      statusKesadaran={patient.statusKesadaran}
      history={patient.ttvHistory ?? []}
    />
  );
}
