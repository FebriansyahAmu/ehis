import ReferensiKamarPage from "@/components/bpjs/aplicares/ReferensiKamarPage";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

export default async function Page() {
  await requireBpjsMenu("/ehis-bpjs/aplicares/referensi-kamar");
  return <ReferensiKamarPage />;
}
