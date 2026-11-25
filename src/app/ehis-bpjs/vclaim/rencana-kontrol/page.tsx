import RencanaKontrolPage from "@/components/bpjs/rencana-kontrol/RencanaKontrolPage";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

export const metadata = { title: "Rencana Kontrol — BPJS Integration Hub" };

export default async function Page() {
  await requireBpjsMenu("/ehis-bpjs/vclaim/rencana-kontrol");
  return <RencanaKontrolPage />;
}
