import MonitoringPage from "@/components/bpjs/monitoring/MonitoringPage";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

export const metadata = { title: "Monitoring — BPJS Integration Hub" };

export default async function Page() {
  await requireBpjsMenu("/ehis-bpjs/vclaim/monitoring");
  return <MonitoringPage />;
}
