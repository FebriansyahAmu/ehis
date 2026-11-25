import MapKelasPage from "@/components/bpjs/aplicares/MapKelasPage";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

export default async function Page() {
  await requireBpjsMenu("/ehis-bpjs/aplicares/map-kelas");
  return <MapKelasPage />;
}
