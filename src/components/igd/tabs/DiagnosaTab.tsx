import DiagnosaTabShared from "@/components/shared/medical-records/DiagnosaTab";
import type { IGDPatientDetail } from "@/lib/data";

export default function DiagnosaTab({ patient }: { patient: IGDPatientDetail }) {
  return <DiagnosaTabShared initialDiagnosa={patient.diagnosa} kunjunganId={patient.id} />;
}
