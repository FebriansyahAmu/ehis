import CPPTTabShared from "@/components/shared/medical-records/CPPTTab";
import type { RawatInapPatientDetail } from "@/lib/data";

export default function CPPTTab({ patient }: { patient: RawatInapPatientDetail }) {
  return <CPPTTabShared initialEntries={patient.cppt} showDate requiresVerification />;
}
