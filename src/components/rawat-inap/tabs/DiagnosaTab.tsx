import DiagnosaTabShared from "@/components/shared/medical-records/DiagnosaTab";
import type { RawatInapPatientDetail } from "@/lib/data";

export default function DiagnosaTab({ patient }: { patient: RawatInapPatientDetail }) {
  return <DiagnosaTabShared initialDiagnosa={patient.diagnosa} />;
}
