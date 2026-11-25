import KetersediaanKamarPage from "@/components/bpjs/aplicares/KetersediaanKamarPage";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

export default async function Page() {
  await requireBpjsMenu("/ehis-bpjs/aplicares/ketersediaan");
  return <KetersediaanKamarPage />;
}
