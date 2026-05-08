import CPPTTabShared from "@/components/shared/medical-records/CPPTTab";
import type { IGDPatientDetail } from "@/lib/data";

export default function CPPTTab({ patient }: { patient: IGDPatientDetail }) {
  return <CPPTTabShared initialEntries={patient.cppt} />;
}
