import RujukanPage from "@/components/bpjs/rujukan/RujukanPage";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

export const metadata = { title: "Rujukan — BPJS Integration Hub" };

export default async function Page() {
  await requireBpjsMenu("/ehis-bpjs/vclaim/rujukan");
  return <RujukanPage />;
}
